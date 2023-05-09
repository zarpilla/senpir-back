const fs = require("fs");

async function isFirstRun() {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: "type",
      name: "setup",
    });
    const initHasRun = await pluginStore.get({ key: "initHasRun" });
    await pluginStore.set({ key: "initHasRun", value: true });
    return !initHasRun;
  }

async function start() {

    try {

        const shouldImportSeedData = await isFirstRun();
        if (!shouldImportSeedData) {
            return
        }
        
        return {
            success: true,
            // records
        }
    }
    catch (e) {
        console.error('Error importing file (1)', e)
        return {
            messsage: 'Error importing file',
            success: false,
            e
        }
    }
}


module.exports = async () => {
    try {
      await start();
    } catch (error) {
      console.log("Could not import seed data");
      console.error(error);
    }
  };