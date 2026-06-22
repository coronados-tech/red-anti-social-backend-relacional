const { filterCommentsByMonths } = require("../helpers/filterCommentsByMonths");

const filterPostCommentsMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (req.method === "GET") {
      if (Array.isArray(body)) {
        body.forEach((post) => {
          if (post?.comments) {
            post.comments = filterCommentsByMonths(post.comments);
          }
        });
      } else if (body?.comments) {
        body.comments = filterCommentsByMonths(body.comments);
      }
    }

    return originalJson(body);
  };

  next();
};

module.exports = filterPostCommentsMiddleware;
