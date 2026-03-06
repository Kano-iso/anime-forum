// 角色图片映射配置
// 角色名 -> 图片序号
export const CHARACTER_IMAGE_MAP: Record<string, string> = {
  'Ariel': '1.jpg',
  '阿米娅': '2.jpg',
  '初音未来': '3.jpg',
  '绫波丽': '4.jpg',
  '蕾姆': '5.jpg',
  '御坂美琴': '6.jpg',
};

// 获取角色图片 URL
export function getCharacterImageUrl(characterName: string): string {
  const imageName = CHARACTER_IMAGE_MAP[characterName];
  if (imageName) {
    return `/images/characters/${imageName}`;
  }
  // 默认头像 - 使用 Dicebear API
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(characterName)}`;
}

// 检查角色是否有本地图片
export function hasLocalImage(characterName: string): boolean {
  return !!CHARACTER_IMAGE_MAP[characterName];
}
