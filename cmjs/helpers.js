const session = require("./session");

module.exports = {
  /**
   * hamdlebar helper, to create a link to another page
   * adds session id as query paremeter, to support sessions without cookie,
   * @param {*} _id
   * @param {*} context
   */
  link(_id, context) {
    if (
      session.isQueryParameterEnabled() &&
      context.data.root.session &&
      context.data.root.session._id
    ) {
      return `/${_id}?session=${context.data.root.session._id}`;
    } else {
      return `/${_id}`;
    }
  },
};
