import Role from '@models/role';

class RolesController {
  list = async (ctx) => {
    const roles = await Role.find({});

    ctx.body = {
      data: roles,
    };
  }
}

export default new RolesController();
