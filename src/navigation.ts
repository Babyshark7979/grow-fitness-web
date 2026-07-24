import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Trang chủ',
      href: getPermalink('/'),
    },
    {
      text: 'Lớp tập & Dịch vụ',
      href: getPermalink('/services'),
    },
    {
      text: 'Bảng giá',
      href: getPermalink('/pricing'),
    },
    {
      text: 'Về chúng tôi',
      href: getPermalink('/about'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Liên hệ',
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'Đặt chỗ pre-sale', href: getPermalink('/join'), variant: 'primary' }],
};

export const footerData = {
  links: [
    {
      title: 'Tập luyện',
      links: [
        { text: 'Gym & Tạ tự do', href: getPermalink('/services') },
        { text: 'Personal Training (PT)', href: getPermalink('/services') },
        { text: 'Group Class', href: getPermalink('/services') },
        { text: 'Yoga & Pilates', href: getPermalink('/services') },
      ],
    },
    {
      title: 'Grow Fitness',
      links: [
        { text: 'Về chúng tôi', href: getPermalink('/about') },
        { text: 'Bảng giá', href: getPermalink('/pricing') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Liên hệ', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Hỗ trợ',
      links: [
        { text: 'Câu hỏi thường gặp', href: getPermalink('/#faqs') },
        { text: 'Lịch tập', href: getPermalink('/services') },
        { text: 'Chính sách hội viên', href: getPermalink('/terms') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Điều khoản', href: getPermalink('/terms') },
    { text: 'Chính sách bảo mật', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
    { ariaLabel: 'YouTube', icon: 'tabler:brand-youtube', href: '#' },
    { ariaLabel: 'TikTok', icon: 'tabler:brand-tiktok', href: '#' },
  ],
  footNote: `
    <span class="text-muted">© 2026 Grow Fitness · Nâng tầm thể chất mỗi ngày.</span>
  `,
};
