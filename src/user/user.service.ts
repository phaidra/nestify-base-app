import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { addHours } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { CreateForgotPasswordDto } from './dto/create-forgot-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyUuidDto } from './dto/verify-uuid.dto';
import { RefreshAccessTokenDto } from './dto/refresh-access-token.dto';
import { ForgotPassword } from './interfaces/forgot-password.interface';
import { User } from './interfaces/user.interface';
import nodemailer from 'nodemailer';

@Injectable()
export class UserService {

  HOURS_TO_VERIFY = parseInt(process.env.JWT_HOURS_TO_VERIFY, 10);
  HOURS_TO_BLOCK = parseInt(process.env.JWT_HOURS_TO_BLOCK, 10);
  LOGIN_ATTEMPTS_TO_BLOCK = parseInt(process.env.JWT_LOGIN_ATTEMPTS_TO_BLOCK, 10);

  constructor(
    @InjectModel('_User') private readonly userModel: Model<User>,
    @InjectModel('ForgotPassword') private readonly forgotPasswordModel: Model<ForgotPassword>,
    private readonly authService: AuthService,
  ) {
  }

  /**
   * registers a new user
   * @param createUserDto
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    await this.isEmailUnique(user.email);
    this.setRegistrationInfo(user);
    await user.save();
    return UserService.buildRegistrationInfo(user);
  }

  /**
   * verifies newly registered user and logs them in
   * @param req
   * @param verifyUuidDto
   */
  async verifyEmail(req: Request, verifyUuidDto: VerifyUuidDto) {
    const user = await this.findByVerification(verifyUuidDto.verification);
    await UserService.setUserAsVerified(user);
    return {
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(user._id),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  /**
   * logs in user
   * @param req
   * @param loginUserDto
   */
  async login(req: Request, loginUserDto: LoginUserDto) {
    const user = await this.findUserByEmail(loginUserDto.email);
    UserService.isUserBlocked(user);
    await this.checkPassword(loginUserDto.password, user);
    await UserService.passwordsAreMatch(user);
    return {
      fullName: user.fullName,
      email: user.email,
      accessToken: await this.authService.createAccessToken(user._id),
      refreshToken: await this.authService.createRefreshToken(req, user._id),
    };
  }

  /**
   * retrieves user by refreshToken and issues new accessToken
   * @param refreshAccessTokenDto
   */
  async refreshAccessToken(refreshAccessTokenDto: RefreshAccessTokenDto) {
    const userId = await this.authService.findRefreshToken(refreshAccessTokenDto.refreshToken);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('Bad request');
    }
    return {
      accessToken: await this.authService.createAccessToken(user._id),
    };
  }

  /**
   * creates password reset token for specific mail adress.
   * @param req
   * @param createForgotPasswordDto
   */
  async forgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
    await this.findUserByEmail(createForgotPasswordDto.email);
    await this.saveForgotPassword(req, createForgotPasswordDto);
    return {
      email: createForgotPasswordDto.email,
      message: 'verification sent.',
    };
  }

  /**
   * verifies password reset token, sets flag in record
   * @param req
   * @param verifyUuidDto
   */
  async forgotPasswordVerify(req: Request, verifyUuidDto: VerifyUuidDto) {
    const forgotPassword = await this.findForgotPasswordByUuid(verifyUuidDto);
    await this.setForgotPasswordFirstUsed(req, forgotPassword);
    return {
      email: forgotPassword.email,
      message: 'now reset your password.',
    };
  }

  /**
   * checks if password reset flag set, saves new password
   * @param resetPasswordDto
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const forgotPassword = await this.findForgotPasswordByEmail(resetPasswordDto);
    await UserService.setForgotPasswordFinalUsed(forgotPassword);
    await this.resetUserPassword(resetPasswordDto);
    return {
      email: resetPasswordDto.email,
      message: 'password successfully chenaged.',
    };
  }

  async findAll() {
    return this.userModel.find();
  }

  /**
   * checks if mail address already registered
   * @param email
   */
  private async isEmailUnique(email: string) {
    const user = await this.userModel.findOne({ email, verified: true });
    if (user) {
      throw new BadRequestException('Email most be unique.');
    }
  }

  /**
   * sets verification token for newly registered user
   * @param user
   */
  private setRegistrationInfo(user): any {
    user.verification = v4();
    user.verificationExpires = addHours(new Date(), this.HOURS_TO_VERIFY);
  }

  /**
   * builds registration info record for newly registered user
   * @param user
   */
  private static buildRegistrationInfo(user): any {
    return {
      fullName: user.fullName,
      email: user.email,
      verified: user.verified,
    };
  }

  /**
   * retrieves registration record by verification token
   * verification status and expiry time
   * @param verification
   */
  private async findByVerification(verification: string): Promise<User> {
    const user = await this.userModel.findOne({
      verification,
      verified: false,
      verificationExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException('Bad request.');
    }
    return user;
  }

  /**
   * sets newly registered user as verified
   * @param user
   */
  private static async setUserAsVerified(user) {
    user.verified = true;
    await user.save();
  }

  /**
   * retrieves user record by email
   * @param email
   */
  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email, verified: true });
    if (!user) {
      throw new NotFoundException('Wrong email or password.');
    }
    return user;
  }

  /**
   * compares entered to retrieved pwd, using bcrypt.compare
   * @param attemptPass
   * @param user
   * @private
   */
  private async checkPassword(attemptPass: string, user: User) {
    const match = await bcrypt.compare(attemptPass, user.password);
    if (!match) {
      await this.passwordsDoNotMatch(user);
      throw new NotFoundException('Wrong email or password.');
    }
    return match;
  }

  /**
   * checks if a user block has been set and is  still valid
   * @param user
   * @private
   */
  private static isUserBlocked(user) {
    if (user.blockExpires > Date.now()) {
      throw new ConflictException('User has been blocked try later.');
    }
  }

  /**
   * increases loginattempt counter and sets user block if max no of
   * attempts is exceeded
   * @param user
   * @private
   */
  private async passwordsDoNotMatch(user) {
    user.loginAttempts += 1;
    await user.save();
    if (user.loginAttempts >= this.LOGIN_ATTEMPTS_TO_BLOCK) {
      await this.blockUser(user);
      throw new ConflictException('User blocked.');
    }
  }

  /**
   * sets user block to configured amount of hourse
   * @param user
   * @private
   */
  private async blockUser(user) {
    user.blockExpires = addHours(new Date(), this.HOURS_TO_BLOCK);
    await user.save();
  }

  /**
   * sets back loginattempt counter to zero (in case of successfull login)
   * @param user
   * @private
   */
  private static async passwordsAreMatch(user) {
    user.loginAttempts = 0;
    await user.save();
  }

  /**
   * creates & saves forgotPassword record incl verification token
   * @param req
   * @param createForgotPasswordDto
   * @private
   */
  private async saveForgotPassword(req: Request, createForgotPasswordDto: CreateForgotPasswordDto) {
    const forgotPassword = await this.forgotPasswordModel.create({
      email: createForgotPasswordDto.email,
      verification: v4(),
      expires: addHours(new Date(), this.HOURS_TO_VERIFY),
      ipRequest: this.authService.getIp(req),
      browserRequest: this.authService.getBrowserInfo(req),
      countryRequest: this.authService.getCountry(req),
    });
    forgotPassword.save(null,(err,doc) => {
      UserService.sendForgotPasswordMail(doc).then((mail) => {
        console.log("reset link sent", mail);
      })
      .catch((err) => {
        console.log('sent mail failed', err);
      });
    });
  }

  private static async sendForgotPasswordMail(forgotPasswordDoc: ForgotPassword) {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: (process.env.MAIL_PORT == "465"),
      auth: process.env.MAIL_USER ? {
        user: process.env.MAIL_USER, // generated ethereal user
        pass: process.env.MAIL_PASS, // generated ethereal password
      } : null,
    });
    return await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADRESS}>`,
      to: forgotPasswordDoc.email,
      subject: "Password Reset Verification Link",
      text: `Please go to https://vchc.univie.ac.at/dbneu/#/en/u/resetpassword/${forgotPasswordDoc.verification} to reset your password.`,
      html: `Please go to <a href="https://vchc.univie.ac.at/dbneu/#/en/u/resetpassword/${forgotPasswordDoc.verification}">this link</a> to reset your password.`,
    });
  }

  /**
   * retrieves forgotPassword record by verification token
   * @param verifyUuidDto
   * @private
   */
  private async findForgotPasswordByUuid(verifyUuidDto: VerifyUuidDto): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      verification: verifyUuidDto.verification,
      firstUsed: false,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  /**
   * sets firstUsed flag and some client info upon successfull submission of the
   * verification token
   * @param req
   * @param forgotPassword
   * @private
   */
  private async setForgotPasswordFirstUsed(req: Request, forgotPassword: ForgotPassword) {
    forgotPassword.firstUsed = true;
    forgotPassword.ipChanged = this.authService.getIp(req);
    forgotPassword.browserChanged = this.authService.getBrowserInfo(req);
    forgotPassword.countryChanged = this.authService.getCountry(req);
    await forgotPassword.save();
  }

  /**
   * retrieves forgotPassword record by mail, firstUsed and finalUsed flag
   * @param resetPasswordDto
   * @private
   */
  private async findForgotPasswordByEmail(resetPasswordDto: ResetPasswordDto): Promise<ForgotPassword> {
    const forgotPassword = await this.forgotPasswordModel.findOne({
      email: resetPasswordDto.email,
      firstUsed: true,
      finalUsed: false,
      expires: { $gt: new Date() },
    });
    if (!forgotPassword) {
      throw new BadRequestException('Bad request.');
    }
    return forgotPassword;
  }

  /**
   * sets finalUsed flag in forgotPassword record upon password change
   * @param forgotPassword
   * @private
   */
  private static async setForgotPasswordFinalUsed(forgotPassword: ForgotPassword) {
    forgotPassword.finalUsed = true;
    await forgotPassword.save();
  }

  /**
   * retrieves user record by mail and sets new password
   * (bcrypt in schema pre-save function)
   * @param resetPasswordDto
   * @private
   */
  private async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      email: resetPasswordDto.email,
      verified: true,
    });
    user.password = resetPasswordDto.password;
    await user.save();
  }
}
