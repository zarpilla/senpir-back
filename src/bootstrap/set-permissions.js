// const strapi = require('@strapi/strapi')

async function setPermissions(roleType, newPermissions) {

    // Find the ID of the public role
    const publicRole = await strapi
      .query("plugin::users-permissions.role")
      .findOne({
        where: {
          type: roleType,
        },
    });
  
    const permissions = await strapi
      .query("plugin::users-permissions.permission")
      .findMany({
        where: {
            role: publicRole.id,
        },
        populate: true
    });

    // Update permission to match new config
    const controllersToUpdate = Object.keys(newPermissions);

    const updatePromises = []
    controllersToUpdate.forEach(async (controller) => {
      newPermissions[controller].forEach(async (action) => {
        const permissionToAdd = `${controller}.${action}`
        if (!permissions.find(p => p.action === `${controller}.${action}`)) {
          const promise = strapi.query("plugin::users-permissions.permission").create({
            data: {
              action: permissionToAdd,
              role: publicRole.id
            }
          })
          updatePromises.push(promise)
        }
      })
    })

    await Promise.all(updatePromises);
}

  
async function start() {    
    await setPermissions("authenticated",       
      {
      }
    );

    await setPermissions("public",       
      {
        "api::itinerary.itinerary": ["find", "findOne"],
      }
    );
}

module.exports = async () => {
  try {
    await start();
  } catch (error) {
    console.log("Could not set permissions");
    console.error(error);
  }
};