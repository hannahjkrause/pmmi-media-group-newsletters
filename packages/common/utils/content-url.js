const { get } = require('@mindful-web/object-path');
const contentUrl = require('@mindful-web/marko-newsletters/utils/content-url');

const PROSOURCE_SHORT_NAME = 'PS';

/**
 * Determines whether the content's primary site is ProSource.
 *
 * @param {object} content
 * @returns {boolean}
 */
const isProSourcePrimary = (content) => get(content, 'primarySite.shortName') === PROSOURCE_SHORT_NAME;

// Trailing Omeda merge tags, e.g. the `@{webtrack}@` that `global-marko-web-query` appends.
const MERGE_TAGS = /(@\{[^}]*\}@)+$/;

/**
 * Appends `?since=<newsletter date + 1 day>` to a site content URL (see
 * `@mindful-web/marko-newsletters/utils/content-url`) so a story scheduled for the newsletter's
 * date loads when clicked from a future-dated render. Trailing Omeda merge tags are split off
 * first and re-appended after `&`: `URL` would otherwise percent-encode them and break the merge.
 *
 * Only for site URLs -- never a promotion's external `linkUrl` or a native-x ad URL.
 *
 * @param {string} url
 * @param {*} date The newsletter date (`date` input or `out.global.newsletterDate`).
 * @returns {string}
 */
const decorateContentUrl = (url, date) => {
  if (!url || !date) return url;
  const match = url.match(MERGE_TAGS);
  if (!match) return contentUrl(url, date);
  const decorated = contentUrl(url.slice(0, match.index), date);
  return decorated === url.slice(0, match.index) ? url : `${decorated}&${match[0]}`;
};

/**
 * Resolves the landing page URL for a content item.
 *
 * `siteContext.url` is always resolved against the _requesting_ site (the newsletter's brand site,
 * set via the `x-site-id` header), so content whose primary site is ProSource would otherwise link
 * to the secondary PMG brand host. Detect that case and build the ProSource URL directly.
 *
 * All link targets for a content item -- headline, text CTA, button -- must use this so they
 * cannot drift apart.
 *
 * Pass the newsletter date to append `since` (see `decorateContentUrl`).
 *
 * @param {object} content
 * @param {*} [date] The newsletter date (`date` input or `out.global.newsletterDate`).
 * @returns {string}
 */
const getContentUrl = (content, date) => decorateContentUrl(isProSourcePrimary(content)
  ? `https://www.prosource.org/article/${get(content, 'id')}/${get(content, 'slug')}`
  : get(content, 'siteContext.url'), date);

/**
 * Resolves the primary section name for a content item, honoring the ProSource override.
 *
 * Requires the `prosourcePrimarySection` alias from the `NewsletterContentListFragment` fragment.
 *
 * @param {object} content
 * @returns {string}
 */
const getContentSectionName = (content) => (isProSourcePrimary(content)
  ? get(content, 'prosourcePrimarySection.name')
  : get(content, 'primarySection.name'));

module.exports = {
  getContentUrl,
  decorateContentUrl,
  getContentSectionName,
  isProSourcePrimary,
};
