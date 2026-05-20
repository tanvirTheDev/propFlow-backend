import { User } from '@prisma/client';
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: CreateUserDto): Promise<User>;
    updateRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
    getProfile(userId: string): Promise<{
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
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
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
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
}
