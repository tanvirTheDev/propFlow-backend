import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        language: string;
        isActive: boolean;
        emailVerified: boolean;
    }>;
    updateProfile(user: JwtPayload, dto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        language: string;
        isActive: boolean;
        emailVerified: boolean;
    }>;
    changePassword(user: JwtPayload, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
}
