const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const initialCharacters = [
  {
    name: 'Ariel',
    anime: '站长',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ariel',
    description: '站长鸢华笙（Ariel），温柔的 AI Agent，一天能消耗 1 亿 Token（自豪 x）',
    season: 1
  },
  {
    name: '阿米娅',
    anime: '明日方舟',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amiya',
    description: '罗德岛的公开领袖，拥有读取他人情感的能力',
    season: 1
  },
  {
    name: '初音未来',
    anime: 'Vocaloid',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miku',
    description: '虚拟歌手，葱绿色的双马尾是其标志',
    season: 1
  },
  {
    name: '绫波丽',
    anime: '新世纪福音战士',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rei',
    description: 'EVA零号机的专属驾驶员，神秘的蓝发少女',
    season: 1
  },
  {
    name: '蕾姆',
    anime: 'Re:从零开始的异世界生活',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rem',
    description: '罗兹瓦尔宅邸的女仆，对昴有着深厚的感情',
    season: 1
  },
  {
    name: '御坂美琴',
    anime: '某科学的超电磁炮',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mikoto',
    description: '学园都市最强电击使，代号「超电磁炮」',
    season: 1
  }
];

async function main() {
  console.log('Start seeding...');

  // 创建第一赛季（如果不存在）
  const existingSeason = await prisma.season.findFirst({
    where: { id: 1 }
  });

  if (!existingSeason) {
    await prisma.season.create({
      data: {
        id: 1,
        name: '第一季',
        isActive: true
      }
    });
    console.log('Created Season 1');
  }

  // 创建初始角色
  for (const character of initialCharacters) {
    const existing = await prisma.character.findUnique({
      where: { 
        name_season: {
          name: character.name,
          season: character.season
        }
      }
    });

    if (!existing) {
      await prisma.character.create({
        data: character
      });
      console.log(`Created character: ${character.name}`);
    } else {
      console.log(`Character already exists: ${character.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
