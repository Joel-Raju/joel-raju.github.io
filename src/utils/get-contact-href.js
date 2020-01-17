// @flow
const getContactHref = (name: string, contact: string) => {
  let href;

  switch (name) {
    case 'twitter':
      href = `https://www.twitter.com/${contact}`;
      break;
    case 'github':
      href = `https://github.com/${contact}`;
      break;
    case 'linkedin':
      href = `https://linkedin.com/in/${contact}`;
      break;
    case 'medium':
      href = `https://medium.com/@${contact}`;
      break;
    case 'devto':
      href = `https://dev.to/${contact}`;
      break;
    case 'stackoverflow':
      href = `https://stackoverflow.com/users/${contact}`;
      break;
    case 'producthunt':
      href = `https://www.producthunt.com/@${contact}`;
      break;
    case 'email':
      href = `mailto:${contact}`;
      break;
    default:
      href = contact;
      break;
  }

  return href;
};

export default getContactHref;
