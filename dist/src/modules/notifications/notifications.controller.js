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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const notifications_service_1 = require("./notifications.service");
const save_push_subscription_dto_1 = require("./dto/save-push-subscription.dto");
const list_in_app_dto_1 = require("./dto/list-in-app.dto");
let NotificationsController = class NotificationsController {
    constructor(service) {
        this.service = service;
    }
    async savePushSubscription(user, dto) {
        await this.service.savePushSubscription(user.sub, dto.subscription);
        return { success: true };
    }
    async removePushSubscription(user) {
        await this.service.removePushSubscription(user.sub);
        return { success: true };
    }
    listInApp(user, dto) {
        return this.service.listInApp(user.sub, dto);
    }
    async markRead(user, id) {
        try {
            return await this.service.markRead(user.sub, id);
        }
        catch {
            throw new common_1.NotFoundException('Notification not found');
        }
    }
    markAllRead(user) {
        return this.service.markAllRead(user.sub);
    }
    getUnreadCount(user) {
        return this.service.getUnreadCount(user.sub);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('push-subscription'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, save_push_subscription_dto_1.SavePushSubscriptionDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "savePushSubscription", null);
__decorate([
    (0, common_1.Delete)('push-subscription'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "removePushSubscription", null);
__decorate([
    (0, common_1.Get)('in-app'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_in_app_dto_1.ListInAppDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "listInApp", null);
__decorate([
    (0, common_1.Patch)('in-app/:id/read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Post)('in-app/read-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getUnreadCount", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map