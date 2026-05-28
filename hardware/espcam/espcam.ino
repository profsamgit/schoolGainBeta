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
// 1. CONFIGURAÇÃO DINÂMICA VIA PREFERENCES (EEPROM EM FLASH)
// ============================================================================
#include <Preferences.h>
Preferences preferences;
WebServer server(80);

String wifi_ssid = "";
String wifi_password = "";
String schoolgain_server = "";
String terminal_id = "";
String hardware_token = "";
String portal_password = "schoolgain"; // Senha padrão para acessar as configurações
String rfidUrl = "";
String binUrl = "";

#include <WiFiUdp.h>
WiFiUDP udpClient;

void logInfo(String msg) {
  Serial.println(msg);
  if (WiFi.status() == WL_CONNECTED && schoolgain_server.length() > 0) {
    String host = schoolgain_server;
    int startIdx = 0;
    if (host.startsWith("http://")) startIdx = 7;
    else if (host.startsWith("https://")) startIdx = 8;
    int endIdx = host.indexOf(":", startIdx);
    if (endIdx == -1) endIdx = host.indexOf("/", startIdx);
    String ipStr = (endIdx == -1) ? host.substring(startIdx) : host.substring(startIdx, endIdx);
    
    if (ipStr.length() > 0) {
      String mac = WiFi.macAddress();
      String formattedMsg = "[" + mac + "] " + msg;
      udpClient.beginPacket(ipStr.c_str(), 9006);
      udpClient.print(formattedMsg);
      udpClient.endPacket();
    }
  }
}

const char* LOGIN_HTML = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Login - SchoolGain CAM</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; width: 100%; max-width: 320px; }
    h2 { margin-top: 0; color: #6366f1; text-align: center; text-transform: uppercase; font-size: 1.1rem; letter-spacing: 1px; font-weight: 800; }
    p { font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 20px; }
    .group { margin-bottom: 15px; }
    label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 5px; }
    input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 0.9rem; }
    input:focus { outline: none; border-color: #6366f1; }
    button { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 10px; }
    button:hover { background: #4f46e5; }
    .error { color: #f87171; font-size: 0.75rem; text-align: center; margin-bottom: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class='card'>
    <h2>Acesso Restrito</h2>
    <p>ESP32-CAM SchoolGain</p>
    %ERROR%
    <form method='POST' action='/login'>
      <div class='group'>
        <label>Senha do Dispositivo</label>
        <input name='password' type='password' placeholder='Senha' required autofocus>
      </div>
      <button type='submit'>Entrar</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

const char* PORTAL_HTML = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Configuracao SchoolGain CAM</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; width: 100%; max-width: 400px; }
    h2 { margin-top: 0; color: #6366f1; text-align: center; text-transform: uppercase; font-size: 1.2rem; letter-spacing: 1px; font-weight: 800; margin-bottom: 5px; }
    p { font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 20px; }
    .group { margin-bottom: 12px; }
    label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
    input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 0.85rem; }
    input:focus { outline: none; border-color: #6366f1; }
    button { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 8px; font-size: 0.8rem; }
    button:hover { background: #4f46e5; }
    .actions { display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px; }
    .btn-action { background: #334155; font-size: 0.75rem; padding: 8px; margin-top: 0; }
    .btn-action:hover { background: #475569; }
    .btn-reset { background: #ef4444; }
    .btn-reset:hover { background: #dc2626; }
    .footer { text-align: center; font-size: 0.65rem; color: #475569; margin-top: 15px; text-transform: uppercase; font-weight: 700; }
  </style>
</head>
<body>
  <div class='card'>
    <h2>SchoolGain CAM</h2>
    <p>Gerenciamento do Dispositivo</p>
    <form method='POST' action='/save'>
      <div class='group'>
        <label>Wi-Fi SSID</label>
        <input name='ssid' type='text' required value='%SSID%'>
      </div>
      <div class='group'>
        <label>Senha do Wi-Fi</label>
        <input name='pass' type='password' value='%PASS%'>
      </div>
      <div class='group'>
        <label>Servidor (Ex: 192.168.1.100:3000)</label>
        <input name='server' type='text' required value='%SERVER%'>
      </div>
      <div class='group'>
        <label>ID do Terminal</label>
        <input name='termId' type='text' required value='%TERMID%'>
      </div>
      <div class='group'>
        <label>Token de Hardware</label>
        <input name='token' type='text' required value='%TOKEN%'>
      </div>
      <div class='group'>
        <label>Nova Senha do Portal</label>
        <input name='newPortalPass' type='password' placeholder='Deixe em branco para nao alterar'>
      </div>
      <button type='submit'>Salvar e Aplicar</button>
    </form>
    
    <div class='actions'>
      <button class='btn-action' onclick='location.href="/reboot"'>Reiniciar</button>
      <button class='btn-action btn-reset' onclick='if(confirm("Deseja apagar os dados do Wi-Fi e reconfigurar?")) location.href="/reconfig"'>Limpar Wi-Fi</button>
      <button class='btn-action' onclick='location.href="/logout"' style='background: #475569;'>Sair</button>
    </div>
    
    <div class='footer'>Ecossistema IoT SchoolGain</div>
  </div>
</body>
</html>
)rawliteral";

bool isAuthenticated() {
  if (server.hasHeader("Cookie")) {
    String cookie = server.header("Cookie");
    if (cookie.indexOf("pwd=" + portal_password) != -1) {
      return true;
    }
  }
  return false;
}

void handleLogin() {
  if (server.hasArg("password")) {
    String passInput = server.arg("password");
    if (passInput == portal_password) {
      server.sendHeader("Set-Cookie", "pwd=" + portal_password + "; Path=/; Max-Age=3600");
      server.sendHeader("Location", "/config");
      server.send(302, "text/plain", "");
      return;
    }
  }
  server.sendHeader("Location", "/login?error=1");
  server.send(302, "text/plain", "");
}

void handleLogout() {
  server.sendHeader("Set-Cookie", "pwd=; Path=/; Max-Age=0");
  server.sendHeader("Location", "/");
  server.send(302, "text/plain", "");
}

void showLogin(bool hasError) {
  String html = String(LOGIN_HTML);
  if (hasError) {
    html.replace("%ERROR%", "<div class='error'>Senha incorreta! Tente novamente.</div>");
  } else {
    html.replace("%ERROR%", "");
  }
  server.send(200, "text/html", html);
}

void startConfigPortal() {
  WiFi.mode(WIFI_AP);
  
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char apName[32];
  sprintf(apName, "SchoolGain_Cam_%02X%02X%02X", mac[3], mac[4], mac[5]);
  
  WiFi.softAP(apName);
  Serial.print("\n[PORTAL] AP Iniciado. SSID: ");
  Serial.println(apName);
  Serial.print("[PORTAL] Acesse o portal em: http://");
  Serial.println(WiFi.softAPIP());

  // Registra Cookie headers para o portal temporário também
  const char *headerkeys[] = {"Cookie"};
  server.collectHeaders(headerkeys, 1);

  server.on("/", HTTP_GET, []() {
    if (!isAuthenticated()) {
      showLogin(server.hasArg("error"));
      return;
    }
    server.sendHeader("Location", "/config");
    server.send(302, "text/plain", "");
  });

  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_GET, handleLogout);

  server.on("/config", HTTP_GET, []() {
    if (!isAuthenticated()) {
      showLogin(false);
      return;
    }
    String activeSsid = wifi_ssid;
    String activePass = wifi_password;
    if (activeSsid.length() == 0 && WiFi.status() == WL_CONNECTED) {
      activeSsid = WiFi.SSID();
      if (activeSsid == "SchoolGain_Config_Net") {
        activePass = "schoolgain_config_wpa2";
      }
    }
    String html = String(PORTAL_HTML);
    html.replace("%SSID%", activeSsid);
    html.replace("%PASS%", activePass);
    html.replace("%SERVER%", schoolgain_server);
    html.replace("%TERMID%", terminal_id);
    html.replace("%TOKEN%", hardware_token);
    server.send(200, "text/html", html);
  });

  server.on("/save", HTTP_POST, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    if (server.hasArg("ssid") && server.hasArg("server")) {
      wifi_ssid = server.arg("ssid");
      wifi_password = server.arg("pass");
      schoolgain_server = server.arg("server");
      terminal_id = server.arg("termId");
      hardware_token = server.arg("token");
      
      String newPass = server.arg("newPortalPass");

      preferences.begin("schoolgain", false);
      preferences.putString("ssid", wifi_ssid);
      preferences.putString("pass", wifi_password);
      preferences.putString("server", schoolgain_server);
      preferences.putString("termId", terminal_id);
      preferences.putString("token", hardware_token);
      if (newPass.length() > 0) {
        portal_password = newPass;
        preferences.putString("portalPass", portal_password);
      }
      preferences.end();

      String response = "<html><body><h2>Configuracao salva com sucesso!</h2><p>O dispositivo esta reiniciando...</p></body></html>";
      server.send(200, "text/html", response);
      delay(2000);
      ESP.restart();
    } else {
      server.send(400, "text/plain", "Campos obrigatorios faltando");
    }
  });

  server.begin();
  
  while (true) {
    server.handleClient();
    delay(10);
  }
}

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

// Inicializa o Servidor Web na porta 80 (Declarado no topo do arquivo)

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

  logInfo("[CAMERA] Kiosk conectado ao Stream!");
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
  logInfo("[CAMERA] Kiosk desconectado do Stream.");
}

// ============================================================================
// FUNÇÃO PARA ENVIAR A AUTENTICAÇÃO DO ALUNO (RA) VIA REDE
// ============================================================================
// Pode ser acionada via Sensor RFID ou Leitor de Código de Barras serial.
bool send_student_login(String ra) {
  if (WiFi.status() != WL_CONNECTED) {
    logInfo("[HTTP] Não conectado ao Wi-Fi!");
    return false;
  }
  if (rfidUrl.length() == 0) {
    logInfo("[HTTP] Servidor SchoolGain não configurado!");
    return false;
  }

  HTTPClient http;
  logInfo("[HTTP] Enviando login para: " + rfidUrl + " | RA: " + ra);

  http.begin(rfidUrl);
  http.addHeader("Content-Type", "application/json");

  // Monta o JSON Payload
  String jsonPayload = "{\"ra\":\"" + ra + "\",\"terminalId\":\"" +
                       String(terminal_id) + "\",\"token\":\"" +
                       String(hardware_token) + "\"}";

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    logInfo("[HTTP] Resposta HTTP de Login: " + String(httpResponseCode) + " | Conteúdo: " + response);
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
    logInfo("[HTTP] Erro ao enviar POST de Login: " + String(httpResponseCode));
    http.end();
    return false;
  }
}

// ============================================================================
// FUNÇÃO PARA ENVIAR TELEMETRIA DAS LIXEIRAS (SENSORES ULTRASSÔNICOS)
// ============================================================================
bool send_bin_status(int plastico, int papel, int vidro, int metal) {
  if (WiFi.status() != WL_CONNECTED) {
    logInfo("[HTTP] Não conectado ao Wi-Fi!");
    return false;
  }
  if (binUrl.length() == 0) {
    logInfo("[HTTP] Servidor SchoolGain não configurado!");
    return false;
  }

  HTTPClient http;
  logInfo("[HTTP] Enviando status das lixeiras para: " + binUrl + " | Status: " + String(plastico) + "," + String(papel) + "," + String(vidro) + "," + String(metal));

  http.begin(binUrl);
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
    logInfo("[HTTP] Resposta Telemetria HTTP: " + String(httpResponseCode) + " | Conteúdo: " + response);

    // Verifica se o terminal está inativo/suspenso no sistema
    if (response.indexOf("\"active\":false") != -1) {
      if (terminalActive) {
        logInfo("[SYSTEM] AVISO: Este totem foi desativado/suspenso na plataforma!");
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

  // Carrega configurações persistidas do NVS Preferences
  preferences.begin("schoolgain", true);
  wifi_ssid = preferences.getString("ssid", "");
  wifi_password = preferences.getString("pass", "");
  schoolgain_server = preferences.getString("server", "");
  terminal_id = preferences.getString("termId", "");
  hardware_token = preferences.getString("token", "");
  portal_password = preferences.getString("portalPass", "schoolgain");
  preferences.end();

  // Constrói as URLs de API dinamicamente
  String serverBase = schoolgain_server;
  if (serverBase.length() > 0) {
    if (!serverBase.startsWith("http://") && !serverBase.startsWith("https://")) {
      if (serverBase.indexOf(":") != -1 || serverBase.startsWith("192.168.") || serverBase.startsWith("172.16.") || serverBase.startsWith("10.")) {
        serverBase = "http://" + serverBase;
      } else {
        serverBase = "https://" + serverBase;
      }
    }
    rfidUrl = serverBase + "/api/hardware/input";
    binUrl = serverBase + "/api/hardware/bin-status";
  }

  const char* DEFAULT_SSID = "SchoolGain_Config_Net";
  const char* DEFAULT_PASS = "schoolgain_config_wpa2";
  bool connected = false;

  // 1. Tenta conectar ao Wi-Fi configurado nas preferências
  if (wifi_ssid.length() > 0) {
    WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
    Serial.print("[WIFI] Conectando ao Wi-Fi gravado: ");
    Serial.println(wifi_ssid);

    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
      digitalWrite(LED_RED_PIN, !digitalRead(LED_RED_PIN)); // Pisca o led durante conexão
      if (millis() - startAttemptTime > 15000) {
        Serial.println("\n[WIFI] Falha ao conectar ao Wi-Fi gravado.");
        break;
      }
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
    }
  }

  // 2. Se falhar ou não houver Wi-Fi gravado, tenta a rede de configuração padrão (Portable AP)
  if (!connected) {
    WiFi.disconnect();
    delay(500);
    WiFi.begin(DEFAULT_SSID, DEFAULT_PASS);
    Serial.print("[WIFI] Tentando rede de configuracao padrao: ");
    Serial.println(DEFAULT_SSID);

    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
      digitalWrite(LED_RED_PIN, !digitalRead(LED_RED_PIN));
      if (millis() - startAttemptTime > 12000) {
        Serial.println("\n[WIFI] Falha ao conectar a rede de configuracao padrao.");
        break;
      }
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      Serial.println("\n[WIFI] Conectado a rede de configuracao padrao!");
    }
  }

  // 3. Se tudo falhar, inicia o hotspot local como último recurso
  if (!connected) {
    startConfigPortal();
  }

  digitalWrite(LED_RED_PIN,
               HIGH); // Apaga LED vermelho após conectar (ativo baixo)
  Serial.println("");
  Serial.println("[WIFI] Conectado com sucesso!");
  Serial.print("[WIFI] IP Local da ESP32-CAM: ");
  Serial.println(WiFi.localIP());
  Serial.print("[WIFI] Endereco MAC da ESP32-CAM: ");
  Serial.println(WiFi.macAddress());

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

  // Registra Cookie headers para autenticação no modo normal
  const char *headerkeys[] = {"Cookie"};
  server.collectHeaders(headerkeys, 1);

  // Rota de Teste redireciona para o login ou config dependendo da autenticação
  server.on("/", HTTP_GET, []() {
    if (!isAuthenticated()) {
      showLogin(server.hasArg("error"));
      return;
    }
    server.sendHeader("Location", "/config");
    server.send(302, "text/plain", "");
  });

  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_GET, handleLogout);

  // Rota para visualização do formulário de configuração no IP local (Autenticado)
  server.on("/config", HTTP_GET, []() {
    if (!isAuthenticated()) {
      showLogin(server.hasArg("error"));
      return;
    }
    String activeSsid = wifi_ssid;
    String activePass = wifi_password;
    if (activeSsid.length() == 0 && WiFi.status() == WL_CONNECTED) {
      activeSsid = WiFi.SSID();
      if (activeSsid == "SchoolGain_Config_Net") {
        activePass = "schoolgain_config_wpa2";
      }
    }
    String html = String(PORTAL_HTML);
    html.replace("%SSID%", activeSsid);
    html.replace("%PASS%", activePass);
    html.replace("%SERVER%", schoolgain_server);
    html.replace("%TERMID%", terminal_id);
    html.replace("%TOKEN%", hardware_token);
    server.send(200, "text/html", html);
  });

  // Rota para salvar configurações no IP local (Autenticado)
  server.on("/save", HTTP_POST, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    if (server.hasArg("ssid") && server.hasArg("server")) {
      wifi_ssid = server.arg("ssid");
      wifi_password = server.arg("pass");
      schoolgain_server = server.arg("server");
      terminal_id = server.arg("termId");
      hardware_token = server.arg("token");
      
      String newPass = server.arg("newPortalPass");

      preferences.begin("schoolgain", false);
      preferences.putString("ssid", wifi_ssid);
      preferences.putString("pass", wifi_password);
      preferences.putString("server", schoolgain_server);
      preferences.putString("termId", terminal_id);
      preferences.putString("token", hardware_token);
      if (newPass.length() > 0) {
        portal_password = newPass;
        preferences.putString("portalPass", portal_password);
      }
      preferences.end();

      String response = "<html><body><h2>Configuracao salva com sucesso!</h2><p>O dispositivo esta reiniciando...</p></body></html>";
      server.send(200, "text/html", response);
      delay(2000);
      ESP.restart();
    } else {
      server.send(400, "text/plain", "Campos obrigatorios faltando");
    }
  });

  // Rota para reiniciar o dispositivo via rede
  server.on("/reboot", HTTP_GET, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    server.send(200, "text/html", "<html><body><h2>Reiniciando...</h2></body></html>");
    delay(1500);
    ESP.restart();
  });

  // Rota para limpar Wi-Fi e reconfigurar via rede
  server.on("/reconfig", HTTP_GET, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    server.send(200, "text/html", "<html><body><h2>Memoria apagada. Reiniciando em modo Config Portal AP...</h2></body></html>");
    preferences.begin("schoolgain", false);
    preferences.clear();
    preferences.end();
    delay(1500);
    ESP.restart();
  });

  server.begin();
  logInfo("[SERVER] Servidor HTTP de Stream e Configuracao iniciado! IP: " + WiFi.localIP().toString());
}

// ============================================================================
// LOOP PRINCIPAL
// ============================================================================
void loop() {
  // Lida com conexões HTTP recebidas (Stream)
  server.handleClient();

  // Se o totem estiver inativo, reduz a frequência de telemetria para 5 minutos (economizar banda/processamento)
  unsigned long telemetryInterval = terminalActive ? 30000 : 300000;

  // Envia telemetria de lixeiras a cada intervalo definido (Apenas se configurado)
  if (binUrl.length() > 0 && millis() - lastTelemetryTime >= telemetryInterval) {
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
      if (input == "RESET" || input == "CONFIG") {
        Serial.println("[SYSTEM] Comando RESET recebido. Apagando configuracoes e reiniciando...");
        preferences.begin("schoolgain", false);
        preferences.clear();
        preferences.end();
        delay(1000);
        ESP.restart();
      } else if (input.startsWith("STATUS:")) {
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
