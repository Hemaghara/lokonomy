/**
 * Escapes special regex characters in a string to prevent ReDoS attacks.
 * Use this whenever constructing a RegExp from user input.
 * @param {string} str - The user-provided string to escape.
 * @returns {string} The escaped string safe for use in new RegExp().
 */
const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = escapeRegex;
