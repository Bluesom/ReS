class JsonDatabaseModel {
    constructor(jsonServer, databasePath) {
        this.router = jsonServer.router(databasePath)
    }

    get(path) {
        return this.router.db.get(path)
    }

    set(path, value) {
        return this.router.db.set(path, value)
    }
}

module.exports = JsonDatabaseModel
