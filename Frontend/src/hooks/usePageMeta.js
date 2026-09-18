import { useEffect } from 'react';

// Minimal SEO helper for this SPA (no extra dependency).
// Sets document title, meta description and Open Graph title/description.
const upsertMeta = (selector, create) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    create(el);
    document.head.appendChild(el);
  }
  return el;
};

const usePageMeta = ({ title, description }) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      upsertMeta('meta[name="description"]', (el) => el.setAttribute('name', 'description')).setAttribute(
        'content',
        description
      );
      upsertMeta('meta[property="og:title"]', (el) => el.setAttribute('property', 'og:title')).setAttribute(
        'content',
        title || document.title
      );
      upsertMeta('meta[property="og:description"]', (el) =>
        el.setAttribute('property', 'og:description')
      ).setAttribute('content', description);
    }
  }, [title, description]);
};

export default usePageMeta;
