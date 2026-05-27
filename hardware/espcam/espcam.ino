/*
 * ============================================================================
 * SCHOOLGAIN v2.2 - FIRMWARE ESP32-CAM (AI-THINKER)
 * ============================================================================
 * Este código configura a ESP32-CAM para:
 * 1. Conectar à rede Wi-Fi local.
 * 2. Servir um stream de vídeo MJPEG em tempo real compatível com o SchoolGain
 * Kiosk.
 * 3. Enviar gatilhos de login (RA/RFID) para a API do servidor SchoolGain.
 *
 * Placa Recomendada no Arduino IDE: "ESP32 Dev Module"
 * Bibliotecas Necessárias:
 * - ESP32 de Espressif (Instalar via Gerenciador de Placas)
 */

#include "esp_camera.h"
#include <HTTPClient.h>
#include <WebServer.h>
#include <WiFi.h>
#include <WiFiClient.h>

// ============================================================================
// 1. CONFIGURAÇÃO DE REDE WI-FI
// ============================================================================
const char *ssid = "SEU-WIFI";
const char *password = "SUA SENHA";

// ============================================================================
// 2. CONFIGURAÇÃO DO SERVIDOR SCHOOLGAIN
// ============================================================================
// IMPORTANTE: Use o IP local do computador rodando o servidor (ex:
// 192.168.1.10). Não use "localhost", pois a ESP32 é um dispositivo físico
// independente na rede.
const char *schoolgain_server = "172.16.0.118:3000";
const char *terminal_id = "HW-C001863B4D7A"; // ID gerado no painel Admin
const char *hardware_token =
    "sg_hardware_secret_2026"; // Token padrão do SchoolGain

// ============================================================================
// 3. MAPEAMENTO DE PINOS (MODELO AI-THINKER ESP32-CAM)
// ============================================================================
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

#define LED_FLASH_PIN 4 // Pino do LED Flash traseiro (opcional)
#define LED_RED_PIN 33 // Led vermelho interno para indicar status (ativo baixo)

// Inicializa o Servidor Web na porta 80
WebServer server(80);

// Controle de tempo para telemetria das lixeiras
unsigned long lastTelemetryTime = 0;
bool terminalActive = true; // Controla se o terminal está ativo/autorizado no servidor

// Cabeçalhos para o Stream MJPEG
#define PART_BOUNDARY "123456789000000000000987654321"
static const char *_STREAM_CONTENT_TYPE =
    "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *_STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *_STREAM_PART =
    "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

// ============================================================================
// ROTA /stream - SERVE O STREAM DE VÍDEO PARA O KIOSK
// ============================================================================
void handle_stream() {
  char *part_buf[64];

  WiFiClient client = server.client();

  if (!terminalActive) {
    client.printf("HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nTotem inativo no sistema.");
    Serial.println("[CAMERA] Conexão de stream rejeitada: Este Totem está inativo no painel de controle.");
    return;
  }

  // Envia cabeçalho HTTP padrão de Stream
  client.printf("HTTP/1.1 200 OK\r\nContent-Type: "
                "%s\r\nAccess-Control-Allow-Origin: *\r\n\r\n",
                _STREAM_CONTENT_TYPE);

  Serial.println("[CAMERA] Kiosk conectado ao Stream!");
  digitalWrite(LED_RED_PIN, LOW); // Liga o LED interno indicando atividade

  // ACENDE O LED FLASH AUTOMATICAMENTE APENAS SE O PARÂMETRO ?flash=on ESTIVER
  // PRESENTE Evita ofuscar o aluno com luz forte na cara durante o
  // Login/Identificação!
  bool enable_flash = false;
  if (server.hasArg("flash") && server.arg("flash") == "on") {
    enable_flash = true;
  }

  if (enable_flash) {
    digitalWrite(LED_FLASH_PIN, HIGH);
    Serial.println(
        "[LED] Flash aceso automaticamente via Stream (Modo Scanner)!");
  } else {
    digitalWrite(LED_FLASH_PIN, LOW);
    Serial.println(
        "[LED] Stream iniciado SEM flash (Modo Login/Identificação).");
  }

  while (true) {
    if (!client.connected()) {
      break;
    }

    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[CAMERA] Falha ao capturar frame");
      delay(100);
      continue;
    }

    // Envia o divisor de frame
    if (!client.print(_STREAM_BOUNDARY)) {
      esp_camera_fb_return(fb);
      break;
    }

    // Envia o cabeçalho do frame atual
    size_t hlen = snprintf((char *)part_buf, 64, _STREAM_PART, fb->len);
    if (!client.write((const char *)part_buf, hlen)) {
      esp_camera_fb_return(fb);
      break;
    }

    // Envia os bytes da imagem (JPEG)
    if (!client.write(fb->buf, fb->len)) {
      esp_camera_fb_return(fb);
      break;
    }

    esp_camera_fb_return(fb);

    // Sincronização de CPU: Atraso de 25ms garante excelente framerate (~30
    // FPS)
    delay(25);
  }

  // APAGA O LED FLASH AUTOMATICAMENTE AO ENCERRAR A TRANSMISSÃO (se foi aceso)
  if (enable_flash) {
    digitalWrite(LED_FLASH_PIN, LOW);
    Serial.println("[LED] Flash apagado automaticamente ao encerrar Stream!");
  }

  digitalWrite(LED_RED_PIN, HIGH); // Apaga o LED interno (ativo baixo)
  Serial.println("[CAMERA] Kiosk desconectado do Stream.");
}

// ============================================================================
// FUNÇÃO PARA ENVIAR A AUTENTICAÇÃO DO ALUNO (RA) VIA REDE
// ============================================================================
// Pode ser acionada via Sensor RFID ou Leitor de Código de Barras serial.
bool send_student_login(String ra) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Não conectado ao Wi-Fi!");
    return false;
  }

  HTTPClient http;
  String url = String(schoolgain_server) + "/api/hardware/input";

  Serial.print("[HTTP] Enviando login para: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Monta o JSON Payload
  String jsonPayload = "{\"ra\":\"" + ra + "\",\"terminalId\":\"" +
                       String(terminal_id) + "\",\"token\":\"" +
                       String(hardware_token) + "\"}";

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Resposta HTTP: ");
    Serial.println(httpResponseCode);
    Serial.print("[HTTP] Conteúdo: ");
    Serial.println(response);
    http.end();

    // Pisca o LED interno indicando envio bem-sucedido
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_RED_PIN, LOW);
      delay(100);
      digitalWrite(LED_RED_PIN, HIGH);
      delay(100);
    }
    return true;
  } else {
    Serial.print("[HTTP] Erro ao enviar POST: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// ============================================================================
// FUNÇÃO PARA ENVIAR TELEMETRIA DAS LIXEIRAS (SENSORES ULTRASSÔNICOS)
// ============================================================================
bool send_bin_status(int plastico, int papel, int vidro, int metal) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Não conectado ao Wi-Fi!");
    return false;
  }

  HTTPClient http;
  String url = String(schoolgain_server);
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }
  url += "/api/hardware/bin-status";

  Serial.print("[HTTP] Enviando status das lixeiras para: ");
  Serial.println(url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(hardware_token));

  // Monta o JSON Payload
  String jsonPayload = "{\"terminalId\":\"" + String(terminal_id) + "\",\"levels\":{" +
                       "\"plastico\":" + String(plastico) + "," +
                       "\"papel\":" + String(papel) + "," +
                       "\"vidro\":" + String(vidro) + "," +
                       "\"metal\":" + String(metal) + "}}";

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Resposta Telemetria HTTP: ");
    Serial.println(httpResponseCode);
    Serial.print("[HTTP] Conteúdo: ");
    Serial.println(response);

    // Verifica se o terminal está inativo/suspenso no sistema
    if (response.indexOf("\"active\":false") != -1) {
      if (terminalActive) {
        Serial.println("[SYSTEM] AVISO: Este totem foi desativado/suspenso na plataforma!");
        terminalActive = false;
      }
    } else if (response.indexOf("\"active\":true") != -1) {
      if (!terminalActive) {
        Serial.println("[SYSTEM] INFO: Este totem foi reativado com sucesso!");
        terminalActive = true;
      }
    }

    http.end();
    return true;
  } else {
    Serial.print("[HTTP] Erro ao enviar POST de Telemetria: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// ============================================================================
// SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n--- SCHOOLGAIN HARDWARE CORE INITIALIZATION ---");

  // Configuração dos Pinos de Status
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_FLASH_PIN, OUTPUT);
  digitalWrite(LED_RED_PIN,
               HIGH); // Apaga LED vermelho interno (ativo em nível baixo)
  digitalWrite(LED_FLASH_PIN, LOW); // Mantém Flash desligado

  // Configuração Física da Câmera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.pixel_format = PIXFORMAT_JPEG;

  // Ajusta qualidade dependendo da capacidade de PSRAM
  if (psramFound()) {
    config.xclk_freq_hz = 20000000; // 20 MHz para alto desempenho

    // OPÇÕES DE ALTA RESOLUÇÃO COM PSRAM (Descomente apenas a que deseja usar):
    // config.frame_size = FRAMESIZE_UXGA;   // Resolução MÁXIMA física
    // (1600x1200) - ~2-5 FPS config.frame_size = FRAMESIZE_SXGA;   // Resolução
    // Ultra Clara (1280x1024) - ~8-10 FPS
    config.frame_size =
        FRAMESIZE_CIF; // Resolução CIF (400x296) -
                       // ~50 FPS (Máxima velocidade de leitura de QR)
    // config.frame_size = FRAMESIZE_VGA;   // Resolução VGA (640x480)
    // config.frame_size = FRAMESIZE_HD;    // Resolução HD

    config.jpeg_quality =
        12; // Qualidade JPEG equilibrada (10 a 63) - 12 reduz tamanho do
            // payload em 40% mantendo nitidez perfeita
    config.fb_count = 2; // Mantém 2 buffers para maior fluidez de captura
    config.fb_location = CAMERA_FB_IN_PSRAM; // Aloca buffers na PSRAM externa
    Serial.println("[SYSTEM] PSRAM detectada com sucesso! Configurada para "
                   "RESOLUCAO CIF (400x296).");
  } else {
    config.xclk_freq_hz =
        10000000; // Reduz a frequencia do clock da camera para 10 MHz (diminui
                  // tamanho do buffer DMA exigido)
    config.frame_size =
        FRAMESIZE_QVGA;       // Fallback seguro para SRAM interna (320x240)
    config.jpeg_quality = 15; // Menor qualidade para economizar espaco na SRAM
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_DRAM; // Aloca buffer na SRAM interna
    Serial.println("[SYSTEM] AVISO CRITICO: PSRAM NAO encontrada/ativada!");
    Serial.println("[SYSTEM] Usando fallback de baixa resolucao (QVGA) para "
                   "evitar estouro de memoria.");
    Serial.println(
        "[SYSTEM] DICA: No Arduino IDE, selecione a placa 'AI Thinker "
        "ESP32-CAM' e garanta que o PSRAM esteja habilitado.");
  }

  // Inicializa o Sensor de Câmera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf(
        "[CAMERA] Falha fatal na inicialização da câmera (Erro: 0x%x)\n", err);
    while (true) {
      digitalWrite(LED_RED_PIN, LOW);
      delay(100);
      digitalWrite(LED_RED_PIN, HIGH);
      delay(100);
    }
  }

  // Configurações do Sensor de Imagem otimizadas para Totem escuro alimentado
  // por Flash LED
  sensor_t *s = esp_camera_sensor_get();
  s->set_brightness(
      s, 0); // Brilho neutro (0) para evitar superexposição com o flash próximo
  s->set_contrast(
      s, 1); // Aumenta o contraste (1) para ajudar a destacar as bordas do lixo
  s->set_saturation(s, 1);    // Aumenta a saturação (1) para ressaltar cores
                              // originais do objeto (metal, plástico, etc)
  s->set_gain_ctrl(s, 1);     // Habilita Controle Automático de Ganho (AGC)
  s->set_exposure_ctrl(s, 1); // Habilita Controle Automático de Exposição (AEC)

  // Otimizações Físicas Anti-Ofuscamento (Evita superexposição provocada pelo
  // Flash próximo)
  s->set_ae_level(s, -1); // Reduz ligeiramente a compensação de exposição
                          // automática para mitigar clarão do flash
  s->set_gainceiling(
      s, GAINCEILING_4X); // Limita o ganho máximo do sensor sob flash intenso
                          // para evitar estouro de branco

  s->set_aec2(s, 1);     // Habilita AEC avançado de DSP
  s->set_whitebal(s, 1); // Habilita Balanço de Branco Automático (AWB)
  s->set_awb_gain(s, 1); // Habilita ganho AWB
  s->set_wb_mode(s, 0);  // Modo de balanço de branco automático (0: Auto)
  s->set_lenc(s, 1);     // Habilita correção de sombreamento da lente
  s->set_raw_gma(s, 1);  // Habilita correção de gama
  s->set_dcw(
      s, 1); // Habilita redução de ruído digital e supressão de pixel branco

  Serial.println(
      "[CAMERA] Sensor otimizado com sucesso para ambientes internos!");

  // Conexão Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("[WIFI] Conectando a ");
  Serial.println(ssid);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_RED_PIN,
                 !digitalRead(LED_RED_PIN)); // Pisca o led durante conexão
  }

  digitalWrite(LED_RED_PIN,
               HIGH); // Apaga LED vermelho após conectar (ativo baixo)
  Serial.println("");
  Serial.println("[WIFI] Conectado com sucesso!");
  Serial.print("[WIFI] IP Local da ESP32-CAM: ");
  Serial.println(WiFi.localIP());

  // Define a Rota de Streaming
  server.on("/stream", HTTP_GET, handle_stream);

  // Rota para acender o Flash LED (GPIO 4)
  server.on("/led/on", HTTP_GET, []() {
    digitalWrite(LED_FLASH_PIN, HIGH);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "LED ON");
    Serial.println("[LED] Flash aceso!");
  });

  // Rota para apagar o Flash LED (GPIO 4)
  server.on("/led/off", HTTP_GET, []() {
    digitalWrite(LED_FLASH_PIN, LOW);
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "LED OFF");
    Serial.println("[LED] Flash apagado!");
  });

  // Rota para mudar a resolução da câmera física em tempo real
  server.on("/resolution", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    if (server.hasArg("val")) {
      String val = server.arg("val");
      sensor_t *s = esp_camera_sensor_get();
      if (s) {
        if (val == "vga") {
          s->set_framesize(s, FRAMESIZE_VGA);
          server.send(200, "text/plain", "OK - VGA");
          Serial.println(
              "[CAMERA] Resolucao alterada fisicamente para VGA (640x480)");
        } else if (val == "hd") {
          s->set_framesize(s, FRAMESIZE_HD);
          server.send(200, "text/plain", "OK - HD");
          Serial.println(
              "[CAMERA] Resolucao alterada fisicamente para HD (1280x720)");
        } else if (val == "svga") {
          s->set_framesize(s, FRAMESIZE_SVGA);
          server.send(200, "text/plain", "OK - SVGA");
          Serial.println(
              "[CAMERA] Resolucao alterada fisicamente para SVGA (800x600)");
        } else if (val == "cif") {
          s->set_framesize(s, FRAMESIZE_CIF);
          server.send(200, "text/plain", "OK - CIF (400x296)");
          Serial.println(
              "[CAMERA] Resolucao alterada fisicamente para CIF (400x296)");
        } else {
          server.send(400, "text/plain", "Invalid value");
        }
      } else {
        server.send(500, "text/plain", "Sensor not ready");
      }
    } else {
      server.send(400, "text/plain", "Missing val parameter");
    }
  });

  // Rota de Teste para conferir status
  server.on("/", HTTP_GET, []() {
    server.send(
        200, "text/plain",
        "ESP32-CAM SchoolGain ativa! Acesse /stream para o feed de video.");
  });

  server.begin();
  Serial.println("[SERVER] Servidor de Stream HTTP iniciado!");
  Serial.print("[SERVER] Stream URL: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/stream");
}

// ============================================================================
// LOOP PRINCIPAL
// ============================================================================
void loop() {
  // Lida com conexões HTTP recebidas (Stream)
  server.handleClient();

  // Se o totem estiver inativo, reduz a frequência de telemetria para 5 minutos (economizar banda/processamento)
  unsigned long telemetryInterval = terminalActive ? 30000 : 300000;

  // Envia telemetria de lixeiras a cada intervalo definido
  if (millis() - lastTelemetryTime >= telemetryInterval) {
    lastTelemetryTime = millis();
    if (!terminalActive) {
      Serial.println("[TELEMETRIA] Totem suspenso. Tentando contato de validação em segundo plano...");
    } else {
      Serial.println("[TELEMETRIA] Lendo sensores físicos e reportando...");
    }
    // Simula níveis de lixeiras de 0 a 100%
    int plastico = random(10, 95);
    int papel = random(5, 80);
    int vidro = random(2, 60);
    int metal = random(15, 90);
    send_bin_status(plastico, papel, vidro, metal);
  }

  // --------------------------------------------------------------------------
  // EXEMPLO DE INTEGRAÇÃO COM DISPOSITIVOS DE LOGIN OU LEITURAS MANUAIS
  // Se você digitar "ALUNO12345" no Monitor Serial, ele simulará um login.
  // Se digitar "STATUS:10,20,30,40" ele simulará telemetria manual.
  // --------------------------------------------------------------------------
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      if (input.startsWith("STATUS:")) {
        String levelsStr = input.substring(7);
        int comma1 = levelsStr.indexOf(',');
        int comma2 = levelsStr.indexOf(',', comma1 + 1);
        int comma3 = levelsStr.indexOf(',', comma2 + 1);
        if (comma1 != -1 && comma2 != -1 && comma3 != -1) {
          int plastico = levelsStr.substring(0, comma1).toInt();
          int papel = levelsStr.substring(comma1 + 1, comma2).toInt();
          int vidro = levelsStr.substring(comma2 + 1, comma3).toInt();
          int metal = levelsStr.substring(comma3 + 1).toInt();
          Serial.println("[HARDWARE] Simulação de telemetria manual recebida!");
          send_bin_status(plastico, papel, vidro, metal);
        } else {
          Serial.println("[HARDWARE] Formato de telemetria inválido. Use STATUS:plastico,papel,vidro,metal");
        }
      } else {
        Serial.print("[HARDWARE] Simulação de leitura de RA pelo sensor: ");
        Serial.println(input);
        send_student_login(input);
      }
    }
  }
}
