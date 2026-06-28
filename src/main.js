const app = require("./app");
const initDatabase = require("./db/database");

const PORT = process.env.PORT || 3001;

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`App iniciada en el puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
