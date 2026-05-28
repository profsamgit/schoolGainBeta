#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <WebServer.h>
#include <Preferences.h>

// ==========================================
// CONFIGURAÇÕES DINÂMICAS VIA PREFERENCES (FLASH NVS)
// ==========================================
Preferences preferences;
WebServer server(80);

String wifi_ssid = "";
String wifi_password = "";
String schoolgain_server = "";
String terminalId = "";
String hardwareToken = "";
String portal_password = "schoolgain"; // Senha padrão para o portal

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
  <title>Login - SchoolGain TOTEM</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; width: 100%; max-width: 320px; }
    h2 { margin-top: 0; color: #10b981; text-align: center; text-transform: uppercase; font-size: 1.1rem; letter-spacing: 1px; font-weight: 800; }
    p { font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 20px; }
    .group { margin-bottom: 15px; }
    label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 5px; }
    input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 0.9rem; }
    input:focus { outline: none; border-color: #10b981; }
    button { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #10b981; color: #0f172a; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 10px; }
    button:hover { background: #059669; }
    .error { color: #f87171; font-size: 0.75rem; text-align: center; margin-bottom: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class='card'>
    <h2>Acesso Restrito</h2>
    <p>Controlador de Descarte SchoolGain</p>
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
  <title>Configuracao SchoolGain TOTEM</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; width: 100%; max-width: 400px; }
    h2 { margin-top: 0; color: #10b981; text-align: center; text-transform: uppercase; font-size: 1.2rem; letter-spacing: 1px; font-weight: 800; margin-bottom: 5px; }
    p { font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 20px; }
    .group { margin-bottom: 12px; }
    label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
    input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 0.85rem; }
    input:focus { outline: none; border-color: #10b981; }
    button { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #10b981; color: #0f172a; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: background 0.2s; margin-top: 8px; font-size: 0.8rem; }
    button:hover { background: #059669; }
    .actions { display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid #334155; padding-top: 15px; }
    .btn-action { background: #334155; font-size: 0.75rem; padding: 8px; margin-top: 0; color: #fff; }
    .btn-action:hover { background: #475569; }
    .btn-reset { background: #ef4444; }
    .btn-reset:hover { background: #dc2626; }
    .footer { text-align: center; font-size: 0.65rem; color: #475569; margin-top: 15px; text-transform: uppercase; font-weight: 700; }
  </style>
</head>
<body>
  <div class='card'>
    <h2>SchoolGain TOTEM</h2>
    <p>Configure a conexao do dispositivo</p>
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
        <label>ID do Terminal (terminal_id)</label>
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
      server.sendHeader("Location", "/");
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
  sprintf(apName, "SchoolGain_Totem_%02X%02X%02X", mac[3], mac[4], mac[5]);
  
  WiFi.softAP(apName);
  Serial.print("\n[PORTAL] AP Iniciado. SSID: ");
  Serial.println(apName);
  Serial.print("[PORTAL] Acesse o portal em: http://");
  Serial.println(WiFi.softAPIP());

  // Registra Cookie headers para autenticação
  const char *headerkeys[] = {"Cookie"};
  server.collectHeaders(headerkeys, 1);

  server.on("/", HTTP_GET, []() {
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
    html.replace("%TERMID%", terminalId);
    html.replace("%TOKEN%", hardwareToken);
    server.send(200, "text/html", html);
  });

  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_GET, handleLogout);

  server.on("/save", HTTP_POST, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    if (server.hasArg("ssid") && server.hasArg("server")) {
      wifi_ssid = server.arg("ssid");
      wifi_password = server.arg("pass");
      schoolgain_server = server.arg("server");
      terminalId = server.arg("termId");
      hardwareToken = server.arg("token");
      
      String newPass = server.arg("newPortalPass");

      preferences.begin("schoolgain", false);
      preferences.putString("ssid", wifi_ssid);
      preferences.putString("pass", wifi_password);
      preferences.putString("server", schoolgain_server);
      preferences.putString("termId", terminalId);
      preferences.putString("token", hardwareToken);
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

// ==========================================
// PINAGEM DO HARDWARE (OTIMIZADA PARA CONEXÃO DIRETA)
// ==========================================
#define RST_PIN  4
#define SS_PIN   5
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Ponte H (Esteira) - Lado Direito
const int motorPin1 = 21; 
const int motorPin2 = 22; 

// Buzzer de Alerta - Lado Direito
const int buzzerPin = 15;

// Servos (MG995) - Lado Esquerdo
Servo servoPlastico;
Servo servoPapel;
Servo servoVidro;
Servo servoMetal;
const int servoPins[] = {26, 27, 14, 12}; // Plástico (D26), Papel (D27), Vidro (D14), Metal (D12)

// Configurações Físicas das Comportas
const int ANGULO_REPOUSO = 0;      
const int ANGULO_LEVANTADA = 90;   
const int ANGULO_INCLINADA = 45;   

// Sonares HC-SR04
const int numSensores = 4;
const char* categorias[] = {"plastico", "papel", "vidro", "metal"};

// Gatilhos separados por lado (Esquerda vs Direita) para evitar pontes longas de fios
const int trigPinEsquerda = 25;
const int trigPinDireita = 2;
const int echoPins[] = {32, 33, 17, 16}; // Sonares 1 & 2 (Esquerda: D32, D33), Sonares 3 & 4 (Direita: TX2/D17, RX2/D16)
const float LIXEIRA_VAZIA_DIST_CM = 80.0;
const float LIXEIRA_CHEIA_DIST_CM = 10.0;

// Filtro de Média Móvel (5 amostras por sensor)
const int AMOSTRAS = 5;
float historicoDistancia[4][AMOSTRAS];
int indiceAmostra[4] = {0, 0, 0, 0};

unsigned long ultimaLeituraSonares = 0;
unsigned long intervaloSonares = 10000; // Modificado para não ser const e permitir Modo Eco 

// Debounce do RFID
String ultimoUidLido = "";
unsigned long tempoUltimoRfid = 0;

// Estado de Alerta de Lixeira Cheia
bool lixeiraCheiaDetectada = false;
bool terminalActive = true; // Controla se o totem está ativo/autorizado no servidor

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();

  // Configuração da Esteira (Ponte H) e Buzzer
  pinMode(motorPin1, OUTPUT);
  pinMode(motorPin2, OUTPUT);
  pinMode(buzzerPin, OUTPUT);
  pararEsteira();
  desativarBuzzer();

  // Configuração do Trigger e Echos dos Sonares
  pinMode(trigPinEsquerda, OUTPUT);
  pinMode(trigPinDireita, OUTPUT);
  for (int i = 0; i < numSensores; i++) {
    pinMode(echoPins[i], INPUT);
    for (int j = 0; j < AMOSTRAS; j++) {
      historicoDistancia[i][j] = LIXEIRA_VAZIA_DIST_CM;
    }
  }

  // Inicializa os Servos no estado desligado/repouso
  retornarAoRepouso();

  // Carrega configurações persistidas do NVS Preferences
  preferences.begin("schoolgain", true);
  wifi_ssid = preferences.getString("ssid", "");
  wifi_password = preferences.getString("pass", "");
  schoolgain_server = preferences.getString("server", "");
  terminalId = preferences.getString("termId", "");
  hardwareToken = preferences.getString("token", "");
  portal_password = preferences.getString("portalPass", "schoolgain");
  preferences.end();

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
      if (millis() - startAttemptTime > 15000) {
        Serial.println("\n[WIFI] Falha ao conectar ao Wi-Fi gravado.");
        break;
      }
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
    }
  }

  // 2. Se falhar ou não houver Wi-Fi gravado, tenta a rede de configuração padrão (AP Portátil)
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

  // Constrói as URLs de API dinamicamente
  String serverBase = schoolgain_server;
  if (!serverBase.startsWith("http://") && !serverBase.startsWith("https://")) {
    if (serverBase.indexOf(":") != -1 || serverBase.startsWith("192.168.") || serverBase.startsWith("172.16.") || serverBase.startsWith("10.")) {
      serverBase = "http://" + serverBase;
    } else {
      serverBase = "https://" + serverBase;
    }
  }
  rfidUrl = serverBase + "/api/hardware/input";
  binUrl = serverBase + "/api/hardware/bin-status";

  // 3. Se tudo falhar, inicia o hotspot local como último recurso
  if (!connected) {
    startConfigPortal();
  }

  logInfo("[WIFI] Conectado com sucesso! IP Local: " + WiFi.localIP().toString());
  logInfo("[WIFI] URLs configuradas: " + rfidUrl);

  // Registra Cookie headers para autenticação no modo normal
  const char *headerkeys[] = {"Cookie"};
  server.collectHeaders(headerkeys, 1);

  server.on("/", HTTP_GET, []() {
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
    html.replace("%TERMID%", terminalId);
    html.replace("%TOKEN%", hardwareToken);
    server.send(200, "text/html", html);
  });

  server.on("/login", HTTP_POST, handleLogin);
  server.on("/logout", HTTP_GET, handleLogout);

  server.on("/save", HTTP_POST, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    if (server.hasArg("ssid") && server.hasArg("server")) {
      wifi_ssid = server.arg("ssid");
      wifi_password = server.arg("pass");
      schoolgain_server = server.arg("server");
      terminalId = server.arg("termId");
      hardwareToken = server.arg("token");
      
      String newPass = server.arg("newPortalPass");

      preferences.begin("schoolgain", false);
      preferences.putString("ssid", wifi_ssid);
      preferences.putString("pass", wifi_password);
      preferences.putString("server", schoolgain_server);
      preferences.putString("termId", terminalId);
      preferences.putString("token", hardwareToken);
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

  server.on("/reboot", HTTP_GET, []() {
    if (!isAuthenticated()) {
      server.send(401, "text/plain", "Nao autorizado");
      return;
    }
    server.send(200, "text/html", "<html><body><h2>Reiniciando Totem...</h2></body></html>");
    delay(1500);
    ESP.restart();
  });

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
  logInfo("[SERVER] Servidor HTTP de Configuracao local iniciado! IP: " + WiFi.localIP().toString());
}

void ligarEsteira() {
  digitalWrite(motorPin1, HIGH);
  digitalWrite(motorPin2, LOW);
}

void pararEsteira() {
  digitalWrite(motorPin1, LOW);
  digitalWrite(motorPin2, LOW);
}

void ativarBuzzer() {
  digitalWrite(buzzerPin, HIGH);
}

void desativarBuzzer() {
  digitalWrite(buzzerPin, LOW);
}

void emitirBeepSucesso() {
  ativarBuzzer();
  delay(150);
  desativarBuzzer();
}

void prenderServos() {
  servoPlastico.attach(servoPins[0]);
  servoPapel.attach(servoPins[1]);
  servoVidro.attach(servoPins[2]);
  servoMetal.attach(servoPins[3]);
}

void soltarServos() {
  servoPlastico.detach();
  servoPapel.detach();
  servoVidro.detach();
  servoMetal.detach();
}

void retornarAoRepouso() {
  prenderServos();
  servoPlastico.write(ANGULO_REPOUSO);
  servoPapel.write(ANGULO_REPOUSO);
  servoVidro.write(ANGULO_REPOUSO);
  servoMetal.write(ANGULO_REPOUSO);
  delay(600); 
  soltarServos();
}

void acionarTriagem(String material) {
  logInfo("[TRIAGEM] Acionando comporta de material: " + material);
  prenderServos();
  
  // 1. Levanta todas as barreiras
  servoPlastico.write(ANGULO_LEVANTADA);
  servoPapel.write(ANGULO_LEVANTADA);
  servoVidro.write(ANGULO_LEVANTADA);
  servoMetal.write(ANGULO_LEVANTADA);
  delay(100);

  // 2. Coloca apenas o material de destino na angulação de rampa
  if (material == "plastico") {
    servoPlastico.write(ANGULO_INCLINADA);
  } else if (material == "papel") {
    servoPapel.write(ANGULO_INCLINADA);
  } else if (material == "vidro") {
    servoVidro.write(ANGULO_INCLINADA);
  } else if (material == "metal") {
    servoMetal.write(ANGULO_INCLINADA);
  }
  delay(400); 

  // 3. Roda a esteira para mover o descarte
  ligarEsteira();
  
  // 4. Aguarda o item escorregar
  delay(6000); 

  // 5. Encerra e repousa
  pararEsteira();
  retornarAoRepouso();
  logInfo("[TRIAGEM] Triagem concluida.");
}

float obterDistanciaSonar(int sensorIdx) {
  int echo = echoPins[sensorIdx];
  int trig = (sensorIdx < 2) ? trigPinEsquerda : trigPinDireita;
  
  // Pulso de trigger
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  
  // Lê o eco específico do canal selecionado
  long duracao = pulseIn(echo, HIGH, 30000);
  if (duracao == 0) return LIXEIRA_VAZIA_DIST_CM;
  
  float dist = duracao * 0.0343 / 2.0;
  
  // Filtro de Média Móvel
  historicoDistancia[sensorIdx][indiceAmostra[sensorIdx]] = dist;
  indiceAmostra[sensorIdx] = (indiceAmostra[sensorIdx] + 1) % AMOSTRAS;
  
  float soma = 0;
  for (int i = 0; i < AMOSTRAS; i++) {
    soma += historicoDistancia[sensorIdx][i];
  }
  return soma / (float)AMOSTRAS;
}

int calcularPorcentagem(float distanciaMedia) {
  distanciaMedia = constrain(distanciaMedia, LIXEIRA_CHEIA_DIST_CM, LIXEIRA_VAZIA_DIST_CM);
  float rangeTotal = LIXEIRA_VAZIA_DIST_CM - LIXEIRA_CHEIA_DIST_CM;
  float rangeOcupado = LIXEIRA_VAZIA_DIST_CM - distanciaMedia;
  return constrain((int)((rangeOcupado / rangeTotal) * 100.0), 0, 100);
}

void loop() {
  // Processa as requisições HTTP da página de configurações se houver
  server.handleClient();

  // 1. BIP DE ALERTA ATIVO (Se alguma lixeira estiver cheia >= 85%)
  if (lixeiraCheiaDetectada) {
    static unsigned long ultimoApito = 0;
    if (millis() - ultimoApito > 2000) {
      ativarBuzzer();
      delay(80);
      desativarBuzzer();
      delay(80);
      ativarBuzzer();
      delay(80);
      desativarBuzzer();
      ultimoApito = millis();
    }
  }

  // 2. Leitura do Cartão RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String tagUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      tagUID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      tagUID += String(mfrc522.uid.uidByte[i], HEX);
    }
    tagUID.toUpperCase();

    if (tagUID != ultimoUidLido || millis() - tempoUltimoRfid > 5000) {
      ultimoUidLido = tagUID;
      tempoUltimoRfid = millis();
      
      if (!terminalActive) {
        logInfo("[RFID] Leitura bloqueada: Totem inativo no servidor.");
        // Beeps de erro (3 bips curtos)
        for (int i = 0; i < 3; i++) {
          ativarBuzzer();
          delay(80);
          desativarBuzzer();
          delay(80);
        }
      } else {
        logInfo("[RFID] Cartão lido. UID: " + tagUID);
        emitirBeepSucesso(); 

        if (WiFi.status() == WL_CONNECTED) {
          HTTPClient http;
          http.begin(rfidUrl);
          http.addHeader("Content-Type", "application/json");
          http.addHeader("Authorization", String("Bearer ") + hardwareToken);
          String payload = "{\"ra\":\"" + tagUID + "\",\"terminalId\":\"" + String(terminalId) + "\",\"token\":\"" + String(hardwareToken) + "\"}";
          http.POST(payload);
          http.end();
        }
        
        acionarTriagem("plastico");
      }
    }

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }

  // 3. Leitura e Envio de status de preenchimento das Lixeiras
  if (millis() - ultimaLeituraSonares >= intervaloSonares) {
    int pctCheio[numSensores];
    bool algumCheio = false;

    for (int i = 0; i < numSensores; i++) {
      float distFiltrada = obterDistanciaSonar(i);
      pctCheio[i] = calcularPorcentagem(distFiltrada);
      if (pctCheio[i] >= 85) {
        algumCheio = true;
      }
      delay(50); 
    }

    lixeiraCheiaDetectada = algumCheio; 

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(binUrl);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + hardwareToken);
      
      String payload = "{\"terminalId\":\"" + String(terminalId) + "\",\"levels\":{";
      for (int i = 0; i < numSensores; i++) {
        payload += "\"" + String(categorias[i]) + "\":" + String(pctCheio[i]);
        if (i < numSensores - 1) payload += ",";
      }
      payload += "}}";
      
      logInfo("[TELEMETRIA] Lendo sonares e reportando status: " + payload);
      
      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        String response = http.getString();
        logInfo("[HTTP] Resposta Telemetria: " + response);
        
        // Trata a resposta de ativação/suspensão do servidor
        if (response.indexOf("\"active\":false") != -1) {
          if (terminalActive) {
            logInfo("[SYSTEM] Totem inativo/suspenso no servidor. Entrando em Modo Eco.");
            terminalActive = false;
            intervaloSonares = 300000; // 5 minutos
            pararEsteira();
          }
        } else if (response.indexOf("\"active\":true") != -1) {
          if (!terminalActive) {
            logInfo("[SYSTEM] Totem reativado pelo servidor! Retornando ao Modo Normal.");
            terminalActive = true;
            intervaloSonares = 10000; // 10 segundos
          }
        }
      }
      http.end();
    }
    ultimaLeituraSonares = millis();
  }

  // 4. Recebe comandos via Serial Monitor
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input == "RESET" || input == "CONFIG") {
      Serial.println("[SYSTEM] Comando RESET recebido. Apagando configuracoes e reiniciando...");
      preferences.begin("schoolgain", false);
      preferences.clear();
      preferences.end();
      delay(1000);
      ESP.restart();
    }
  }
}
