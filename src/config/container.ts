import { prisma } from "./prisma";
import { RoleRepository } from "../repositories/role.repository";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";

// Simple composition root: wires repositories/services/controllers so route
// modules don't each instantiate their own copies of shared dependencies.
const userRepository = new UserRepository(prisma);
const roleRepository = new RoleRepository(prisma);
const userService = new UserService(userRepository, roleRepository);

export const userController = new UserController(userService);
