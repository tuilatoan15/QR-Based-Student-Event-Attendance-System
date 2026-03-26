const sanitizeHtml = require('sanitize-html');
const input = '<img src="https://res.cloudinary.com/dbj4pib2n/image/upload/v1742564251/events/dptlqg1v4452lcyy8eoe.png" />';
const options = {
  allowedTags: ['img'],
  allowedAttributes: {
    'img': ['src']
  }
};
console.log(sanitizeHtml(input, options));
