# 📡 Proxy Seguro local (ESP32-CAM & Totem Controller Proxy)

Este diretório contém o script do proxy seguro local do **SchoolGain**, projetado para rodar na rede física interna da escola (intranet) e fazer a ponte de comunicação entre as câmeras/totens e a interface web principal HTTPS.

---

## 🔍 Para que serve o Proxy?

Navegadores modernos impedem conexões mistas de segurança. Como a plataforma web principal do **SchoolGain** roda sob protocolo seguro **HTTPS**, o navegador bloqueia conexões diretas a IPs locais inseguros (como `http://192.168.x.x` das câmeras ESP32).

O proxy resolve isso:
1. Ele roda localmente em um computador na mesma rede Wi-Fi que o totem/câmera.
2. Ele recebe as requisições HTTPS e faz a tradução e túnel local para os IPs dinâmicos dos dispositivos.
3. Descobre automaticamente os IPs dos totens consultando o cache ARP e as tabelas UDP locais por meio do MAC Address.

---

## 🛠️ Pré-requisitos

Para executar o proxy local, você precisa ter instalado o **Node.js** (versão 18 ou superior).

*   **Download:** [nodejs.org](https://nodejs.org/) (escolha a versão LTS).
*   **Verificação:** Abra o Prompt de Comando (CMD) ou Terminal e digite:
    ```bash
    node -v
    ```
    (Deve retornar a versão instalada, ex: `v20.11.0`).

---

## 🚀 Como Executar

### Opção A: Executando dentro da Pasta Downloads (Modo Prático)
Se você baixou os arquivos soltos (`Iniciar-Proxy-Local.bat` e `camera-secure-proxy.js`):
1. Mantenha os dois arquivos **na mesma pasta**.
2. Dê dois cliques em `Iniciar-Proxy-Local.bat` para iniciar.

### Opção B: Executando a partir do repositório
No Prompt de Comando dentro do diretório raiz do projeto, execute:
```bash
node scripts/camera-secure-proxy.js
```

---

## 💡 Informações de Rede e Portas
*   **Porta TCP 9005:** Escuta o tráfego de transmissão de vídeo MJPEG e scanner de câmera.
*   **Porta UDP 9006:** Porta de recebimento e mapeamento de logs e telemetria de sensores físicos enviadas pelo Totem Controller.

---

## ❌ Solução de Problemas (Troubleshooting)

### 1. Mensagem "[ERRO] Não foi possível encontrar o arquivo..."
*   **Causa:** O arquivo `camera-secure-proxy.js` não está no mesmo diretório do arquivo `.bat` ou a pasta `scripts` não está presente.
*   **Solução:** Coloque o arquivo `.bat` e o arquivo `.js` na mesma pasta física e tente novamente.

### 2. Porta 9005 já em uso
*   **Causa:** Outra instância do proxy ou outro programa está rodando na porta 9005.
*   **Solução:** Rode o arquivo `Parar-Proxy-Local.bat` para forçar o encerramento do processo anterior na porta.
