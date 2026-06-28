const { Op } = require("sequelize");

const buildSlug = (text) => {
  const slug = String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);

  return slug || "post";
};

const ensureUniqueSlug = async (Post, baseSlug, excludeId) => {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const where = { slug };
    if (excludeId !== undefined) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await Post.findOne({ where, attributes: ["id"] });
    if (!existing) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

module.exports = { buildSlug, ensureUniqueSlug };
