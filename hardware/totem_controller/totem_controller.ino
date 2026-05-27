#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// ==========================================
// CONFIGURAÇÕES DE REDE E SERVIDOR
// ==========================================
const char* ssid = "NOME_DA_SUA_REDE_WIFI";
const char* password = "SENHA_DO_WIFI";
const char* rfidUrl = "https://schoolgain.cetiapicella.com.br/api/hardware/input";
const char* binUrl = "https://schoolgain.cetiapicella.com.br/api/hardware/bin-status";
const char* terminalId = "totem_principal";
const char* hardwareToken = "sg_hardware_secret_2026";

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

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");
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
        Serial.println("[RFID] Leitura bloqueada: Totem inativo no servidor.");
        // Beeps de erro (3 bips curtos)
        for (int i = 0; i < 3; i++) {
          ativarBuzzer();
          delay(80);
          desativarBuzzer();
          delay(80);
        }
      } else {
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
      
      int httpResponseCode = http.POST(payload);
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("[HTTP] Resposta Telemetria: ");
        Serial.println(response);
        
        // Trata a resposta de ativação/suspensão do servidor
        if (response.indexOf("\"active\":false") != -1) {
          if (terminalActive) {
            Serial.println("[SYSTEM] Totem inativo/suspenso no servidor. Entrando em Modo Eco.");
            terminalActive = false;
            intervaloSonares = 300000; // 5 minutos
            pararEsteira();
          }
        } else if (response.indexOf("\"active\":true") != -1) {
          if (!terminalActive) {
            Serial.println("[SYSTEM] Totem reativado pelo servidor! Retornando ao Modo Normal.");
            terminalActive = true;
            intervaloSonares = 10000; // 10 segundos
          }
        }
      }
      http.end();
    }
    ultimaLeituraSonares = millis();
  }
}
