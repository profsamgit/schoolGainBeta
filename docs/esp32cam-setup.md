# 📸 Guia de Integração e Configuração da ESP32-CAM

Este documento explica de forma detalhada como integrar o hardware físico **ESP32-CAM** (comumente referido no projeto como "aspcam" ou "espcam") ao ecossistema **SchoolGain**.

O sistema já está totalmente preparado para suportar a ESP32-CAM de duas formas:
1. **Transmissão de Vídeo (Stream)**: O Kiosk recebe as imagens em tempo real para a Inteligência Artificial analisar os resíduos.
2. **Entrada de Login de Hardware**: Envio do número de registro (RA) ou cartão de proximidade (RFID) por chamadas HTTP automáticas.

---

## 🛠️ Requisitos de Hardware

Para realizar a configuração e gravação, você precisará de:
* **Placa ESP32-CAM** (Modelo recomendado: *AI-Thinker* com sensor de imagem *OV2640*).
* **Shield/Motherboard USB (ESP32-CAM-MB)**: Placa de expansão acoplável que já vem com porta micro-USB integrada e botões físicos de **Reset** e **IO0** para gravação direta sem necessidade de jumpers ou gravadores FTDI externos.
* **Cabo Micro-USB** de boa qualidade (com vias de dados).
* **Fonte de Alimentação Estável de 5V** (Recomendado alimentar a placa com 5V via porta USB do shield conectada a um carregador/porta USB com boa corrente para evitar instabilidade na transmissão).

---

## 💻 1. Configurando o Ambiente de Gravação (Arduino IDE)

1. Faça o download e instale o [Arduino IDE](https://www.arduino.cc/en/software).
2. Abra o Arduino IDE, acesse **Arquivo > Preferências** (File > Preferences).
3. No campo **URLs Adicionais para o Gerenciador de Placas**, cole o link abaixo:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Clique em **OK**.
5. Acesse **Ferramentas > Placa > Gerenciador de Placas** (Tools > Board > Boards Manager).
6. Pesquise por `esp32` (da *Espressif Systems*) e clique em **Instalar** (Recomenda-se a versão mais recente).
7. Após a instalação, configure as opções da placa em **Ferramentas > Placa > esp32**:
   * **Placa (Board)**: Selecione **ESP32 dev module**.
   * **PSRAM**: Altere para **Enabled** (Habilitado). *Esta configuração é mandatória para habilitar a alocação de buffers de imagem de maior resolução e performance.*
   * **Partition Scheme**: Altere para **Huge APP (3MB No OTA/1MB LittleFS)**. *O sistema de arquivos foi atualizado para utilizar o moderno LittleFS para melhor integridade e eficiência de dados.*

> [!IMPORTANT]
> **CONFIGURAÇÃO CRÍTICA DE PARTICIONAMENTO:**
> Devido ao tamanho da biblioteca da câmera, o código é pesado. No menu **Ferramentas (Tools)**, altere a opção **Partition Scheme** para:
> `Huge APP (3MB No OTA/1MB SPIFFS)`. Caso contrário, a compilação falhará por falta de espaço na memória flash.

---

## 🔌 2. Conectando e Colocando em Modo de Gravação (ESP32-CAM-MB)

O uso do shield **ESP32-CAM-MB** elimina a necessidade de fios e adaptadores FTDI complexos. Basta encaixar a ESP32-CAM no shield e conectá-la ao computador via cabo USB.

### Procedimento para Gravação (Entrar em Bootloader):
1. Encaixe a placa **ESP32-CAM** sobre o shield **ESP32-CAM-MB** firmemente, alinhando a antena e a câmera com o conector USB.
2. Conecte o cabo micro-USB à porta do shield e ao computador.
3. Pressione e **mantenha pressionado** o botão **IO0** (ou BOOT) localizado no shield.
4. Enquanto segura o botão **IO0**, pressione e solte o botão **RESET (RST)** uma vez (localizado no shield ou na traseira da ESP32-CAM).
5. **Solte** o botão **IO0**.
6. A placa está agora em modo de gravação (Bootloader) aguardando o upload do firmware do Arduino IDE.

---

## ⚙️ 3. Ajustando o Código e Gravando

O código-fonte pronto para uso encontra-se no arquivo:
📂 `hardware/espcam/espcam.ino` ([Visualizar Código](file:///c:/Temp/project-final/hardware/espcam/espcam.ino))

Abra esse arquivo no Arduino IDE e faça os seguintes ajustes:

1. **Defina a Rede Wi-Fi**:
   ```cpp
   const char* ssid = "NOME_DA_SUA_REDE_WIFI";
   const char* password = "SENHA_DO_SEU_WIFI";
   ```
2. **Defina o Servidor (Computador)**:
   Substitua o IP abaixo pelo **IP local do seu computador** na rede Wi-Fi (Exemplo: `192.168.1.10`):
   ```cpp
   const char* schoolgain_server = "http://192.168.1.10:3000"; // IP Local! Não use "localhost"
   ```
3. **Defina o Terminal ID**:
   Entre no painel administrativo do SchoolGain, registre o Totem sob a aba "Gestão de Totens" e copie o ID gerado (Exemplo: `COLLECT-123A`). Cole-o aqui:
   ```cpp
   const char* terminal_id = "COLLECT-123A";
   ```

### Iniciando a Gravação:
1. No Arduino IDE, selecione a porta serial correspondente à sua placa em **Ferramentas > Porta** (Tools > Port).
2. Clique no botão de **Carregar (Upload)** (seta para a direita).
3. Aguarde até aparecer a mensagem `Done uploading` (Gravação concluída).
4. Após o término da gravação, simplesmente pressione o botão **RESET (RST)** uma vez para que a placa inicie em modo de execução normal (não é necessário desconectar jumpers ou cabos).

---

## 🩺 4. Verificando o Funcionamento na Rede

1. No Arduino IDE, abra o **Monitor Serial** (lupa no canto superior direito) e defina a velocidade de comunicação para `115200` baud.
2. Pressione o botão **RESET** da placa.
3. Você verá mensagens indicando a conexão Wi-Fi. Quando concluído com sucesso, ela exibirá:
   ```text
   [SYSTEM] PSRAM detectada com sucesso!
   [WIFI] Conectado com sucesso!
   [WIFI] IP Local da ESP32-CAM: 192.168.1.50
   [SERVER] Servidor de Stream HTTP iniciado!
   [SERVER] Stream URL: http://192.168.1.50/stream
   ```
4. Abra o navegador no seu computador e acesse `http://192.168.1.50/stream`. Você deverá ver o vídeo em tempo real da câmera!

---

## 🖥️ 5. Integrando no Sistema SchoolGain (Painel Admin)

Com a ESP32-CAM transmitindo o sinal na rede, configure-a no sistema:

1. Inicie o sistema no computador com `npm run dev` e acesse o painel de administração (Ex: `http://localhost:3000/admin`).
2. Acesse a aba **Configurações da Unidade** ou **Gestão de Totens**.
3. Na linha do seu totem ativo, clique no botão de engrenagem (⚙️) para **Configurar Terminal**.
4. No campo **Fonte de Captura (Vídeo)**, altere de *Câmera USB* para **ESP32-CAM (Rede Local)**.
5. No campo **IP da ESP32-CAM**, insira o IP que você obteve no passo anterior (apenas o IP, sem `http://` nem `/stream`, ex: `192.168.1.50`).
6. Clique em **Salvar Alterações**.

A partir deste momento, ao acessar a página de Kiosk do totem (`/kiosk`), a interface usará a câmera física externa de forma transparente!

---

## 💳 6. Entrada de Login Física (Ex: Leitores ou Botões)

Se você conectar um sensor físico de cartões RFID (como o sensor *RC522*) ou um leitor serial de códigos de barras à sua ESP32-CAM:

O firmware está programado para enviar o código lido via POST para o sistema automaticamente através da função `send_student_login("RA_DO_ESTUDANTE")`.

### Teste de Simulação de Hardware:
Para simular um cartão físico sendo lido:
1. Mantenha o **Monitor Serial** do Arduino aberto a `115200` baud.
2. Digite o RA de um estudante ativo (Ex: `ALUNO12345`) no campo de entrada do Monitor Serial e pressione **Enter**.
3. O console mostrará:
   ```text
   [HARDWARE] Simulação de leitura de RA pelo sensor: ALUNO12345
   [HTTP] Enviando login para: http://192.168.1.10:3000/api/hardware/input
   [HTTP] Resposta HTTP: 200
   ```
4. Se a tela de Kiosk do totem correspondente estiver na página de login ("Identificação"), ela mudará **automaticamente** de estágio para a tela de escaneamento de resíduos!

---

## 🔍 Resolução de Problemas Comuns

### ❌ Falha de Conexão com o Servidor (HTTP Code -1 ou 404)
* **Causa**: A ESP32 não consegue encontrar o servidor ou o computador está bloqueando a conexão.
* **Soluções**:
  * Certifique-se de que a ESP32 e o computador do servidor estão conectados na **mesma rede Wi-Fi** (a ESP32-CAM só suporta redes Wi-Fi de **2.4 GHz**).
  * Certifique-se de que digitou o IP correto do seu computador e **não** usou `localhost` ou `127.0.0.1`.
  * Verifique se o Firewall do Windows não está bloqueando conexões de rede local na porta `3000`. Desative-o temporariamente para testar.

### ❌ Imagem com Listras Verdes ou Tela Preta
* **Causa**: Tensão de entrada instável ou cabo flexível da câmera mal encaixado.
* **Soluções**:
  * Verifique se o cabo da câmera preta de lente pequena está perfeitamente inserido no conector FPC da placa.
  * Certifique-se de que a porta USB que está fornecendo energia tem pelo menos 1A a 2A. Algumas portas USB antigas de computadores não fornecem corrente suficiente para o pico de transmissão da ESP32-CAM com flash.

### ❌ Erro "frame buffer malloc failed" ou "Camera config failed with error 0xffffffff"
* **Causa**: O chip da ESP32-CAM não tem memória interna (SRAM) suficiente para alocar imagens de alta resolução sem usar a memória externa PSRAM. Isso ocorre se você estiver usando uma placa genérica sem PSRAM ou se a **PSRAM não foi habilitada nas opções da placa no Arduino IDE**.
* **Soluções**:
  * Vá no menu **Ferramentas (Tools)**, localize a opção **PSRAM** e altere de *Disabled* para **Enabled** (Habilitada).
  * Verifique se selecionou exatamente **ESP** em **Ferramentas > Placa > esp32**.
  * Certifique-se de ter escolhido a partição adequada (como `Huge APP 3MB / 1MB LittleFS`) no gerenciador de partições para compatibilidade com o sistema de arquivos adotado.

