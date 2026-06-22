const MESES = Number(process.env.MESES || 6);

const filterCommentsByMonths = (comments = []) => {
    return comments.filter((comment) => comment.monthsOld < MESES);
};

module.exports = { filterCommentsByMonths };
