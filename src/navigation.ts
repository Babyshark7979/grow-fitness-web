import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Trang chủ',
      href: getPermalink('/'),
    },
    {
      text: 'Tập luyện & Bảng giá',
      href: getPermalink('/join'),
    },
    {
      text: 'Tuyển quản lý',
      href: getPermalink('/careers'),
    },
    {
      text: 'Đồng hành cùng Grow',
      href: getPermalink('/invest'),
    },
    {
      text: 'Khám phá thêm',
      links: [
        {
          text: 'Blog',
          href: getBlogPermalink(),
        },
        {
          text: 'Liên hệ',
          href: getPermalink('/contact'),
        },
        {
          text: 'Grow Fitness FB',
          href: 'https://www.facebook.com/Growfitness',
        },
        {
          text: 'Bếp Healthy',
          href: 'https://www.facebook.com/anngongiudangoceanpark',
        },
      ],
    },
  ],
  actions: [
    { text: 'Khám Phá Gói 99K', href: getPermalink('/join'), variant: 'primary' as const }
  ],
};

export const footerData = {
  links: [
    {
      title: 'Tập luyện',
      links: [
        { text: 'Gói Khám Phá 99K', href: getPermalink('/join') },
        { text: 'Bảng giá niêm yết', href: getPermalink('/join') },
        { text: 'Blog', href: getBlogPermalink() },
      ],
    },
    {
      title: 'Cùng Grow phát triển',
      links: [
        { text: 'Tuyển quản lý phòng tập', href: getPermalink('/careers') },
        { text: 'Đồng hành cùng Grow', href: getPermalink('/invest') },
        { text: 'Liên hệ', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Giờ hoạt động',
      links: [
        { text: 'Thứ 2 – Thứ 6 (nghỉ T7 & CN)', href: getPermalink('/join') },
        { text: 'Ca sáng: 5h–6h (trực tuyến) · 6h–7h · 8h–9h', href: getPermalink('/join') },
        { text: 'Ca chiều tối: 17h–18h (trực tuyến) · 18h30–19h30', href: getPermalink('/join') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Điều khoản', href: getPermalink('/terms') },
    { text: 'Chính sách bảo mật', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/share/1DkFspwMnu/' },
  ],
  footNote: `
    <span class="text-muted">📍 Tòa S109 - 01S10, Vinhomes Ocean Park 1, Gia Lâm, Hà Nội · Phòng tập dành riêng cho nữ<br/>© 2026 Grow Fitness · Tập đúng · Ăn đúng · Có người đồng hành</span>
  `,
};
