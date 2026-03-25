// ============================================================
// Mock Data - Du Lịch Việt
// ============================================================

export interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  image: string;
  images: string[];
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  duration: string; // "3 ngày 2 đêm"
  location: string;
  category: "beach" | "mountain" | "city" | "cultural";
  highlights: string[];
  itinerary: ItineraryDay[];
  includes: string[];
  excludes: string[];
  maxPeople: number;
  minPeople: number;
  availableDates: string[];
  difficulty: "easy" | "moderate" | "hard";
  bestSeason: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  tourTitle: string;
  status: "confirmed" | "pending" | "cancelled";
  checkIn: string;
  participants: number;
  totalPrice: number;
  bookingDate: string;
}

// ============================================================
// Mock Tours
// ============================================================

export const mockTours: Tour[] = [
  {
    id: "1",
    title: "Hà Nội - Hạ Long 3 Ngày 2 Đêm",
    slug: "hanoi-halong-3d2n",
    description: "Khám phá vẻ đẹp Hạ Long từ cổ kính đến hiện đại",
    fullDescription:
      "Tour này sẽ đưa bạn vào một hành trình tuyệt vời khám phá vẻ đẹp tự nhiên của vịnh Hạ Long. Bắt đầu từ thủ đô Hà Nội, bạn sẽ được tham quan các di tích lịch sử, rồi con tàu sẽ đưa bạn đến Hạ Long với những hang động kỳ bí và những hòn đảo đẹp nhất.",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1520763185298-1b434c919eba?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1552062407-291681288323?w=600&h=400&fit=crop",
    ],
    price: 4500000,
    originalPrice: 5500000,
    rating: 4.8,
    reviews: 324,
    duration: "3 ngày 2 đêm",
    location: "Hà Nội - Quảng Ninh",
    category: "beach",
    highlights: [
      "Cruise 5 sao trên vịnh Hạ Long",
      "Tham quan hang Sửng Sốt",
      "Thăm làng chài Cát Bà",
      "Trekking đảo Cát Bà",
    ],
    itinerary: [
      {
        day: 1,
        title: "Hà Nội - Hạ Long",
        description: "Khởi hành sáng từ Hà Nội, đi tuyến cao tốc đến Hạ Long",
        activities: [
          "Xe đón khách tại khách sạn",
          "Đi qua các cảnh quan đẹp",
          "Nhận phòng và buổi chiều tự do",
        ],
        meals: ["Trưa", "Tối"],
        accommodation: "Cruise 5 sao trên vịnh Hạ Long",
      },
      {
        day: 2,
        title: "Khám phá Hạ Long",
        description: "Ngày toàn thăm quan các điểm đẹp nhất vịnh Hạ Long",
        activities: [
          "Tham quan hang Sửng Sốt",
          "Thăm làng chài nổi Cát Bà",
          "Bơi lội trên vịnh Hạ Long",
        ],
        meals: ["Sáng", "Trưa", "Tối"],
        accommodation: "Cruise 5 sao trên vịnh Hạ Long",
      },
      {
        day: 3,
        title: "Haxiêmng - Hà Nội",
        description: "Buổi sáng tự do, chiều trở về Hà Nội",
        activities: [
          "Tự do tham quan thêm",
          "Check out khỏi cruise",
          "Trở về Hà Nội",
        ],
        meals: ["Sáng", "Trưa"],
        accommodation: "N/A",
      },
    ],
    includes: [
      "Vận chuyển xe 4 chỗ",
      "Cruise 5 sao 2 đêm",
      "Ăn sáng, trưa, chiều",
      "Thỏi hướng dẫn tiếng Việt",
      "Bảo hiểm du lịch",
    ],
    excludes: ["Vé máy bay", "Chi phí cá nhân", "Tiền boa cho hướng dẫn"],
    maxPeople: 30,
    minPeople: 2,
    availableDates: [
      "2026-03-20",
      "2026-03-25",
      "2026-04-01",
      "2026-04-10",
    ],
    difficulty: "easy",
    bestSeason: "Tháng 10 - 11, 3 - 4",
  },
  {
    id: "2",
    title: "Sapa - Fansipan 2 Ngày 1 Đêm",
    slug: "sapa-fansipan-2d1n",
    description: "Chinh phục đỉnh Fansipan - Nóc nhà Đông Dương",
    fullDescription:
      "Hành trình chinh phục đỉnh Fansipan cao nhất Đông Dương (3143m). Tour này kết hợp trekking núi, tham quan thung lũng Sapa và trải nghiệm cáp treo xuyên không hiện đại nhất châu Á.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    ],
    price: 3200000,
    originalPrice: 3800000,
    rating: 4.9,
    reviews: 512,
    duration: "2 ngày 1 đêm",
    location: "Lào Cai",
    category: "mountain",
    highlights: [
      "Chinh phục đỉnh Fansipan 3143m",
      "Cáp treo xuyên không Fansipan",
      "Trekking qua ruộng bậc thang",
      "Tham gia lễ hội biểu diễn Sapa",
    ],
    itinerary: [
      {
        day: 1,
        title: "Hà Nội - Sapa",
        description: "Khởi hành từ Hà Nội, tuyến cao tốc đến Sapa",
        activities: [
          "Xe đón tại Hà Nội",
          "Tham quan thị trấn Sapa",
          "Ngắm hoàng hôn từ Silver Waterfall",
        ],
        meals: ["Trưa", "Tối"],
        accommodation: "Sapa Legend Hotel",
      },
      {
        day: 2,
        title: "Chinh phục Fansipan",
        description: "Chinh phục đỉnh Fansipan bằng cáp treo",
        activities: [
          "Trekking rừng tại Sapa",
          "Đi cáp treo Fansipan",
          "Thăm chùa Tây Phương trên đỉnh",
        ],
        meals: ["Sáng", "Trưa"],
        accommodation: "N/A",
      },
    ],
    includes: [
      "Vận chuyển xe",
      "Nhà hàng 3 sao",
      "Ăn sáng, trưa, chiều",
      "Vé cáp treo Fansipan",
      "Hướng dẫn viên",
    ],
    excludes: ["Vé máy bay", "Chi phí cá nhân"],
    maxPeople: 20,
    minPeople: 2,
    availableDates: [
      "2026-03-21",
      "2026-03-28",
      "2026-04-05",
      "2026-04-12",
    ],
    difficulty: "hard",
    bestSeason: "Tháng 9 - 11, 3 - 4",
  },
  {
    id: "3",
    title: "Đà Nẵng - Hội An 3 Ngày 2 Đêm",
    slug: "danang-hoian-3d2n",
    description: "Khám phá biển xanh và phố cổ Hội An",
    fullDescription:
      "Tour kết hợp giữa bãi biển đẹp Đà Nẵng và phố cổ Hội An thơm mộu. Bạn sẽ tham quan các danh lam thắng cảnh, tham gia hoạt động trên biển, và trải nghiệm cuộc sống đêm tại Hội An.",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop",
    ],
    price: 3800000,
    rating: 4.7,
    reviews: 298,
    duration: "3 ngày 2 đêm",
    location: "Quảng Nam - Đà Nẵng",
    category: "beach",
    highlights: [
      "Bãi biển Mỹ Khê - Đà Nẵng",
      "Phố cổ Hội An",
      "Ba Na Hills",
      "Động Marble Mountains",
    ],
    itinerary: [
      {
        day: 1,
        title: "Hà Nội - Đà Nẵng",
        description: "Bay từ Hà Nội đến Đà Nẵng",
        activities: [
          "Bay từ Hà Nội",
          "Nhận phòng khách sạn",
          "Tham quan bãi biển Mỹ Khê",
        ],
        meals: ["Trưa", "Tối"],
        accommodation: "Khách sạn 4 sao",
      },
      {
        day: 2,
        title: "Hội An - Ba Na Hills",
        description: "Thăm phố cổ Hội An và Ba Na Hills",
        activities: [
          "Tham quan phố cổ Hội An",
          "Thăm chùa Cầu",
          "Cáp treo Ba Na Hills",
        ],
        meals: ["Sáng", "Trưa", "Tối"],
        accommodation: "Khách sạn 4 sao",
      },
      {
        day: 3,
        title: "Marble Mountains - Hà Nội",
        description: "Thăm Marble Mountains, bay về Hà Nội",
        activities: [
          "Tham quan Marble Mountains",
          "Tự do tham quan",
          "Bay về Hà Nội",
        ],
        meals: ["Sáng", "Trưa"],
        accommodation: "N/A",
      },
    ],
    includes: [
      "Vé máy bay khứ hồi",
      "Nhà hàng 4 sao",
      "Ăn sáng, trưa, chiều",
      "Vé cáp treo Ba Na",
      "Hướng dẫn viên",
    ],
    excludes: ["Chi phí cá nhân", "Tiền boa"],
    maxPeople: 25,
    minPeople: 2,
    availableDates: [
      "2026-03-22",
      "2026-03-29",
      "2026-04-06",
      "2026-04-15",
    ],
    difficulty: "easy",
    bestSeason: "Tháng 5 - 9",
  },
  {
    id: "4",
    title: "TP. Hồ Chí Minh - Cần Thơ 2 Ngày 1 Đêm",
    slug: "hcm-cantho-2d1n",
    description: "Khám phá chợ nổi và vùng Đồng Bằng Sông Cửu Long",
    fullDescription:
      "Tour du lịch đến Cần Thơ - trái tim của Đồng bằng sông Cửu Long. Bạn sẽ tham quan các chợ nổi nổi tiếng, làng trái cây, và trải nghiệm cuộc sống của người dân tây nam.",
    image: "https://images.unsplash.com/photo-1564760055-e1993d43e54f?w=600&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1564760055-e1993d43e54f?w=600&h=400&fit=crop",
    ],
    price: 2500000,
    rating: 4.6,
    reviews: 189,
    duration: "2 ngày 1 đêm",
    location: "TP. Hồ Chí Minh - Cần Thơ",
    category: "cultural",
    highlights: [
      "Chợ nổi Cái Bè",
      "Chợ nổi Phong Điền",
      "Làng trái cây Mỏ Cày",
      "Thuyền qua vùng sâu Cửu Long",
    ],
    itinerary: [
      {
        day: 1,
        title: "TP. HCM - Cần Thơ",
        description: "Khởi hành từ TP. HCM đến Cần Thơ",
        activities: [
          "Xe đón tại TP. HCM",
          "Tham quan chợ nổi Cái Bè",
          "Tham quan làng trái cây",
        ],
        meals: ["Trưa", "Tối"],
        accommodation: "Khách sạn 3 sao",
      },
      {
        day: 2,
        title: "Chợ nổi Phong Điền - TP. HCM",
        description: "Tham quan chợ nổi Phong Điền, trở về TP. HCM",
        activities: [
          "Thực dậy sớm tham quan chợ nổi",
          "Thuyền qua các kênh",
          "Ăn điểm tâm địa phương",
        ],
        meals: ["Sáng", "Trưa"],
        accommodation: "N/A",
      },
    ],
    includes: [
      "Vận chuyển xe",
      "Nhà hàng 3 sao",
      "Ăn sáng, trưa, chiều",
      "Thuyền tham quan",
      "Hướng dẫn viên",
    ],
    excludes: ["Chi phí cá nhân"],
    maxPeople: 20,
    minPeople: 2,
    availableDates: [
      "2026-03-23",
      "2026-03-30",
      "2026-04-07",
      "2026-04-14",
    ],
    difficulty: "easy",
    bestSeason: "Tháng 11 - 3",
  },
];

// ============================================================
// Mock Users
// ============================================================

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    address: "123 Đường Trần Hưng Đạo, Quận 1, TP. HCM",
  },
  {
    id: "user-2",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0912345678",
    address: "456 Đường Lê Lợi, Quận 1, TP. HCM",
  },
];

// ============================================================
// Mock Bookings
// ============================================================

export const mockBookings: Booking[] = [
  {
    id: "booking-1",
    userId: "user-1",
    tourId: "1",
    tourTitle: "Hà Nội - Hạ Long 3 Ngày 2 Đêm",
    status: "confirmed",
    checkIn: "2026-03-20",
    participants: 2,
    totalPrice: 9000000,
    bookingDate: "2026-03-01",
  },
  {
    id: "booking-2",
    userId: "user-1",
    tourId: "3",
    tourTitle: "Đà Nẵng - Hội An 3 Ngày 2 Đêm",
    status: "pending",
    checkIn: "2026-04-06",
    participants: 4,
    totalPrice: 15200000,
    bookingDate: "2026-03-10",
  },
];

// ============================================================
// Mock Admin Users
// ============================================================

export const mockAdminUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin Quản Lý",
    email: "admin@dulichviet.com",
    phone: "0901111111",
    address: "Du Lịch Việt Office",
  },
  {
    id: "admin-2",
    name: "Editor Du Lịch",
    email: "editor@dulichviet.com",
    phone: "0901111112",
    address: "Du Lịch Việt Office",
  },
];

// ============================================================
// Mock Authentication
// ============================================================

export const mockAccounts = [
  {
    email: "demo@example.com",
    password: "123456",
    user: mockUsers[0],
    role: "user" as const,
  },
  {
    email: "user@example.com",
    password: "123456",
    user: mockUsers[1],
    role: "user" as const,
  },
];

export const mockAdminAccounts = [
  {
    email: "admin@dulichviet.com",
    password: "admin123",
    user: mockAdminUsers[0],
    role: "admin" as const,
  },
  {
    email: "editor@dulichviet.com",
    password: "editor123",
    user: mockAdminUsers[1],
    role: "editor" as const,
  },
];
