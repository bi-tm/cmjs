var queryParameterEnabled = false;
var sessions = {};
const interval = 5 * 60 * 1000;

/**
 * clean old sesseions after 5 minutes
 */
setInterval(function () {
  const compare = Date.now() - interval;
  var idList = [];
  for (const [key, value] of Object.entries(sessions)) {
    if (value.timestamp < compare) {
      delete sessions[key];
    }
  }
}, interval);

const session = {
  /**
   * middleware to add session to response object.
   * session is defined by query parameter, no cookie is needed.
   * all page links in the templates must use {{link ...}} helper function!
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  getByQueryParameter: function (req, res, next) {
    if (!res.locals.session) {
      res.locals.session = session.getOrCreate(req);
    }
    next();
  },

  /**
   * middleware to add session to response object.
   * session is defined by cookie.
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  getByCookie: function (req, res, next) {
    if (!res.locals.session && req.cookies.cmjs) {
      const sessionId = req.cookies.cmjs;
      res.locals.session = sessions[sessionId];
    }
    next();
  },

  /**
   * enable seesions with query parameter
   */
  enableQueryParameter: function () {
    queryParameterEnabled = true;
  },

  isQueryParameterEnabled: function () {
    return queryParameterEnabled;
  },

  getOrCreate: function (req) {
    const now = Date.now();
    var sessionId =
      req.query.session ||
      ((now % 65536) + Math.floor(Math.random() * 4294967296)).toString(16);
    var oSession = session.getById(sessionId) || {
      _id: sessionId,
      timestamp: now,
    };
    sessions[sessionId] = oSession;
    return oSession;
  },

  getById: function (sessionId) {
    const now = Date.now();
    var oSession = sessions[sessionId];
    if (oSession && now - oSession.timestamp < interval) {
      oSession.timestamp = now;
      return oSession;
    } else {
      return undefined;
    }
  },
};

module.exports = session;
