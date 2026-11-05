// ─── 企业场所分类 / 房东名称（确定性 mock） ─────────────────────────────────
// 说明：数据库 Enterprise 目前只有 category（生产型/经营型/…），暂无「场所分类」「房东」字段。
// 这里按企业名称哈希确定性生成，后续接入真实字段时只需替换本文件的实现即可。

export const PLACE_CATEGORIES = ['综合体', '园区', '承租企业', '承租商户', '一般企业', '场所'] as const
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

// 字符串哈希（确定性，同一名称结果稳定）
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// 各分类占比权重（合计 100）：一般企业最多，综合体和园区较少
const CATEGORY_WEIGHTS: { category: PlaceCategory; weight: number }[] = [
  { category: '综合体', weight: 6 },
  { category: '园区', weight: 12 },
  { category: '承租企业', weight: 22 },
  { category: '承租商户', weight: 20 },
  { category: '一般企业', weight: 30 },
  { category: '场所', weight: 10 },
]

/** 企业场所分类（确定性） */
export function getPlaceCategory(name: string): PlaceCategory {
  const r = hashStr(name + '_pc') % 100
  let acc = 0
  for (const { category, weight } of CATEGORY_WEIGHTS) {
    acc += weight
    if (r < acc) return category
  }
  return '一般企业'
}

// 房东名称池（良渚街道范围内的综合体 / 园区 / 楼宇）
const LANDLORD_POOL = [
  '良渚街道玉鸟商业综合体',
  '良渚新城商务中心',
  '勾庄智能制造产业园',
  '良渚文化村商业中心',
  '金家渡综合楼',
  '铭雅商务大厦',
  '通运智慧产业园',
  '施家湾商贸中心',
  '北宸之光商业街',
  '万年桥标准厂房',
  '聚贤科技园',
  '七贤桥工业园',
]

/** 房东名称：仅「承租企业 / 承租商户」有房东，其余返回 '/' */
export function getLandlordName(name: string): string {
  const category = getPlaceCategory(name)
  if (category !== '承租企业' && category !== '承租商户') return '/'
  return LANDLORD_POOL[hashStr(name + '_ll') % LANDLORD_POOL.length]
}

/** 是否属于承租类（有房东） */
export function hasLandlord(name: string): boolean {
  const category = getPlaceCategory(name)
  return category === '承租企业' || category === '承租商户'
}
