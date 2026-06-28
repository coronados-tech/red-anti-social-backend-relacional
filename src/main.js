const app = require("../api/app");

const PORT = process.env.PORT || 3001;

app.ensureDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`App iniciada en el puerto ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
