import type { TourDTO } from "@/types/api";

const VIETNAM_PROVINCES_CITIES = [
  "hà nội", "hồ chí minh", "đà nẵng", "nha trang", "phú quốc", "hạ long", "sapa", "hội an", "đà lạt", "huế", "cần thơ", "vũng tàu",
  "quảng ninh", "lào cai", "quảng nam", "lâm đồng", "thừa thiên huế", "kiên giang", "khánh hòa", "bà rịa vũng tàu",
  "an giang", "bạc liêu", "bến tre", "bình định", "bình dương", "bình phước", "bình thuận", "cà mau", "cao bằng",
  "đắk lắk", "đắk nông", "điện biên", "đồng nai", "đồng tháp", "gia lai", "hà giang", "hà nam", "hà tĩnh",
  "hải dương", "hậu giang", "hòa bình", "hưng yên", "lai châu", "lạng sơn", "nam định", "nghệ an",
  "ninh bình", "ninh thuận", "phú thọ", "quảng bình", "quảng trị", "sóc trăng", "sơn la", "tây ninh",
  "thái bình", "thái nguyên", "thanh hóa", "tiền giang", "trà vinh", "tuyên quang", "vĩnh long", "vĩnh phúc", "yên bái"
];

const INTERNATIONAL_KEYWORDS = [
  "thái lan", "singapore", "malaysia", "nhật bản", "hàn quốc", "trung quốc", 
  "đài loan", "bali", "indonesia", "philippines", "châu âu", "pháp", "mỹ", 
  "úc", "anh", "đức", "ý", "nga", "campuchia", "lào", "myanmar", "thụy sĩ", 
  "tokyo", "seoul", "bangkok", "paris", "london", "sydney", "new york", "kuala lumpur"
];

/**
 * Phân loại tour là trong nước (domestic) hay nước ngoài (international)
 */
export function isDomesticTour(tour: TourDTO): boolean {
  const endDest = (tour.endDestinationName ?? "").toLowerCase().trim();
  const startDest = (tour.startDestinationName ?? "").toLowerCase().trim();
  const tourName = (tour.name ?? "").toLowerCase();

  // 1. Check if name or destination explicitly contains international keywords
  const hasIntlKeyword = INTERNATIONAL_KEYWORDS.some(keyword => 
    tourName.includes(keyword) || 
    endDest.includes(keyword) || 
    startDest.includes(keyword)
  );

  if (hasIntlKeyword) return false;

  // 2. Check if name or destination explicitly contains Vietnam provinces/cities
  const hasDomesticKeyword = VIETNAM_PROVINCES_CITIES.some(city => 
    endDest.includes(city) || 
    tourName.includes(city) || 
    startDest.includes(city)
  );

  if (hasDomesticKeyword) return true;

  // 3. Fallback to even/odd id or hash if it's generic random faker data to guarantee a balanced split in UI
  const idNum = parseInt(tour.id.replace(/\D/g, ""), 10);
  if (!isNaN(idNum)) {
    return idNum % 2 === 0;
  }
  
  return true; // Default to domestic
}
