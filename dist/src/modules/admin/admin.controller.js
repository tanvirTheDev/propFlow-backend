"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const admin_service_1 = require("./admin.service");
const create_org_dto_1 = require("./dto/create-org.dto");
const update_org_dto_1 = require("./dto/update-org.dto");
const add_landlord_dto_1 = require("./dto/add-landlord.dto");
const list_orgs_dto_1 = require("./dto/list-orgs.dto");
const list_queue_dto_1 = require("./dto/list-queue.dto");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    listOrgs(dto) {
        return this.adminService.listOrgs(dto);
    }
    createOrg(dto) {
        return this.adminService.createOrg(dto);
    }
    getOrg(id) {
        return this.adminService.getOrg(id);
    }
    updateOrg(id, dto) {
        return this.adminService.updateOrg(id, dto);
    }
    listOrgUsers(id) {
        return this.adminService.listOrgUsers(id);
    }
    addLandlord(id, dto) {
        return this.adminService.addLandlord(id, dto);
    }
    deactivateUser(caller, userId) {
        return this.adminService.deactivateUser(caller.sub, userId);
    }
    activateUser(userId) {
        return this.adminService.activateUser(userId);
    }
    getStats() {
        return this.adminService.getStats();
    }
    listQueue(dto) {
        return this.adminService.listQueue(dto);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('organisations'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_orgs_dto_1.ListOrgsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listOrgs", null);
__decorate([
    (0, common_1.Post)('organisations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_org_dto_1.CreateOrgDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createOrg", null);
__decorate([
    (0, common_1.Get)('organisations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOrg", null);
__decorate([
    (0, common_1.Patch)('organisations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_org_dto_1.UpdateOrgDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateOrg", null);
__decorate([
    (0, common_1.Get)('organisations/:id/users'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listOrgUsers", null);
__decorate([
    (0, common_1.Post)('organisations/:id/landlords'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_landlord_dto_1.AddLandlordDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "addLandlord", null);
__decorate([
    (0, common_1.Delete)('users/:userId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Post)('users/:userId/activate'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('notification-queue'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_queue_dto_1.ListQueueDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listQueue", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map