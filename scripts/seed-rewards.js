const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");
const path = require("path");
const fs = require("fs");

// Carregar variáveis de ambiente do .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = require("dotenv").config({ path: envPath });
  console.log("Variáveis de ambiente do .env.local carregadas com sucesso!");
} else {
  console.warn("Aviso: arquivo .env.local não encontrado. Usando variáveis globais.");
  require("dotenv").config();
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Erro: Credenciais do Firebase não encontradas nas variáveis de ambiente!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rewards = [
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-K8Y1",
    "name": "Passe Livre do Uniforme",
    "description": "Direito a vir assistir aula sem o uniforme escolar por 1 dia (respeitando o código de vestimenta da escola).",
    "cost": 150,
    "image": "",
    "imageHint": "tshirt_casual_clothing",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-M2P9",
    "name": "Escolha seu Lugar",
    "description": "Permissão para escolher em qual carteira sentar na sala de aula durante uma semana inteira.",
    "cost": 100,
    "image": "",
    "imageHint": "classroom_chair_desk",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-F4X8",
    "name": "Dica de Ouro na Prova",
    "description": "O direito de fazer uma pergunta direta de esclarecimento para o professor durante uma avaliação.",
    "cost": 200,
    "image": "",
    "imageHint": "golden_key_idea",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-T5W3",
    "name": "Entrega Atrasada Simples",
    "description": "Prazo estendido de 24 horas adicionais para entregar um trabalho ou tarefa de casa sem penalidade.",
    "cost": 120,
    "image": "",
    "imageHint": "hourglass_clock_extension",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-H7N2",
    "name": "VIP da Fila da Cantina",
    "description": "Passe livre para furar a fila da cantina (ou passar na frente) durante um intervalo.",
    "cost": 80,
    "image": "",
    "imageHint": "vip_pass_ticket",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-P9L6",
    "name": "Kit Mini-Horta",
    "description": "Um vasinho biodegradável, terra adubada e sementes de temperos (manjericão ou hortelã) para cultivar.",
    "cost": 250,
    "image": "",
    "imageHint": "potted_plant_seedling",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-B3R5",
    "name": "Ecobag Personalizada",
    "description": "Uma sacola de algodão cru ecológica com estampa exclusiva do projeto de reciclagem da escola.",
    "cost": 350,
    "image": "",
    "imageHint": "tote_bag_ecology",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-Y1D7",
    "name": "Garrafa Térmica Bio-Coins",
    "description": "Garrafa de alumínio reutilizável para manter a água gelada e evitar o uso de copos plásticos.",
    "cost": 600,
    "image": "",
    "imageHint": "water_bottle_metal",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-V8C4",
    "name": "Adesivos Holográficos",
    "description": "Cartela de adesivos modernos e ecológicos para colar e decorar o caderno ou notebook.",
    "cost": 50,
    "image": "",
    "imageHint": "cool_stickers_pack",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  },
  {
    "id": "rw-CFJA-GUADALUPE-SRLJG-J9Z3",
    "name": "DJ do Intervalo",
    "description": "Escolha a playlist (aprovada pela coordenação) que vai tocar nas caixas de som da escola durante o recreio.",
    "cost": 180,
    "image": "",
    "imageHint": "music_dj_headphones",
    "schoolId": "SCH-CFJA-GUADALUPE-SRLJG"
  }
];

async function seed() {
  console.log("Iniciando povoamento das recompensas no Firestore...");
  for (const reward of rewards) {
    try {
      await setDoc(doc(db, "rewards", reward.id), reward);
      console.log(`Recompensa adicionada com sucesso: ${reward.name} (ID: ${reward.id})`);
    } catch (error) {
      console.error(`Erro ao adicionar ${reward.name}:`, error);
    }
  }
  console.log("Povoamento concluído com sucesso!");
  process.exit(0);
}

seed();
