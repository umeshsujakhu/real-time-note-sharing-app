import jwt from "jsonwebtoken";
import { User, AuthProvider } from "../models/User";
import { AppDataSource } from "../config/database";
import {
  LoginUserInput,
  RegisterUserInput,
  UserResponse,
} from "../types/user.types";

const userRepository = AppDataSource.getRepository(User);

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterUserInput): Promise<UserResponse> {
    const existingUser = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const user = userRepository.create({
      ...userData,
      provider: AuthProvider.LOCAL,
    });

    await userRepository.save(user);

    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }

  /**
   * Login user with credentials
   */
  async login(
    credentials: LoginUserInput
  ): Promise<{ user: UserResponse; token: string }> {
    const user = await userRepository.findOne({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.provider !== AuthProvider.LOCAL) {
      throw new Error(`This account uses ${user.provider} authentication`);
    }

    const isValid = await user.comparePassword(credentials.password);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user);

    const { password, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  /**
   * Handle OAuth login/register from Google
   */
  async handleGoogleAuth(
    profile: any
  ): Promise<{ user: UserResponse; token: string }> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new Error("Email not provided from Google");
    }

    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user from Google profile
      user = userRepository.create({
        email,
        name:
          profile.displayName ||
          `${profile.name?.givenName || ""} ${
            profile.name?.familyName || ""
          }`.trim(),
        provider: AuthProvider.GOOGLE,
        providerId: profile.id,
        profilePicture: profile.photos?.[0]?.value,
      });
    } else if (user.provider !== AuthProvider.GOOGLE) {
      // If user exists but used a different provider
      user.provider = AuthProvider.GOOGLE;
      user.providerId = profile.id;
    }

    await userRepository.save(user);

    const token = this.generateToken(user);

    const { password, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  /**
   * Handle OAuth login/register from Facebook
   */
  async handleFacebookAuth(
    profile: any
  ): Promise<{ user: UserResponse; token: string }> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new Error("Email not provided from Facebook");
    }

    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user from Facebook profile
      user = userRepository.create({
        email,
        name:
          profile.displayName ||
          `${profile.name?.givenName || ""} ${
            profile.name?.familyName || ""
          }`.trim(),
        provider: AuthProvider.FACEBOOK,
        providerId: profile.id,
        profilePicture: profile.photos?.[0]?.value,
      });
    } else if (user.provider !== AuthProvider.FACEBOOK) {
      // If user exists but used a different provider
      user.provider = AuthProvider.FACEBOOK;
      user.providerId = profile.id;
    }

    await userRepository.save(user);

    const token = this.generateToken(user);

    const { password, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key";
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

    // @ts-ignore - Temporarily ignoring TS error to get things running
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn }
    );
  }
}
