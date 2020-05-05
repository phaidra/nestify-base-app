import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { sign } from 'jsonwebtoken';
import { User } from '../user/interfaces/user.interface';
import { RefreshToken } from './interfaces/refresh-token.interface';
import { v4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { getClientIp } from 'request-ip';
import Cryptr from 'cryptr';

@Injectable()
export class AuthService {

  crypt: any;

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {
    this.crypt = new Cryptr(process.env.JWT_SECRET);
    this.validateUserExternal = this.validateUserExternal.bind(this);
  }

  /**
   * Creates and returns an encrypted Access Token for a given user
   * @param userId
   */
  async createAccessToken(userId: string) {
    const accessToken = sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
    return this.encryptText(accessToken);
  }

  /**
   * Creates a refresh token and saves it to the DB along with the users IP, Browserinfo and Country of Request Origin
   * @param req
   * @param userId
   */
  async createRefreshToken(req: Request, userId) {
    const refreshToken = new this.refreshTokenModel({
      userId,
      refreshToken: v4(),
      ip: this.getIp(req),
      browser: this.getBrowserInfo(req),
      country: this.getCountry(req),
    });
    await refreshToken.save();
    return refreshToken.refreshToken;
  }

  /**
   * Retrieves a refreshToken record by the actual token and returns the associated userID
   * @param token
   */
  async findRefreshToken(token: string) {
    const refreshToken = await this.refreshTokenModel.findOne({ refreshToken: token });
    if (!refreshToken) {
      throw new UnauthorizedException('User has been logged out.');
    }
    return refreshToken.userId;
  }

  /**
   * attempts to retrieve the user record corresponding to a submitted jwt
   * @param jwtPayload
   */
  async validateUser(jwtPayload: JwtPayload): Promise<any> {
    const user = await this.userModel.findOne({ _id: jwtPayload.userId, verified: true });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return user;
  }

  /**
   * JWT Validation function for direct use as express middleware
   * extracts + decrypts jwt from request header + attempts to retrieve
   * corresponding user
   * @param req
   * @param res
   * @param next
   */
  async validateUserExternal(req: Request, res: Response, next: NextFunction): Promise<any> {
    const jwtPayload = this.jwtExtractor(req);
    if(!jwtPayload) {
      res.status(401).json({error:'Session token invalid.'});
    }
    const user = await this.userModel.findOne({ _id: jwtPayload.userId, verified: true });
    if (!user) {
      res.status(401).json({error:'User not found.'});
    }
    next();
    return user;
  }

  /**
   * extracts + decrypts JWT from request header
   * @param request
   */
  private jwtExtractor(request: Request) {
    let token = null;
    if (request.header('x-token')) {
      token = request.get('x-token');
    } else if (request.headers.authorization) {
      token = request.headers.authorization.replace('Bearer ', '').replace(' ', '');
    } else if (request.body.token) {
      token = request.body.token.replace(' ', '');
    }
    if (request.query.token) {
      token = request.body.token.replace(' ', '');
    }
    if (token) {
      try {
        token = this.crypt.decrypt(token);
      } catch (err) {
        throw new BadRequestException('Bad request.');
      }
    }
    token = this.jwtService.decode(token);
    return token;
  }

  /**
   * returns private jwtExtractor for external use
   */
  returnJwtExtractor() {
    return this.jwtExtractor;
  }

  /**
   * extracts IP from request header
   * @param req
   */
  getIp(req: Request): string {
    return getClientIp(req);
  }

  /**
   * extracts Browser Info from request header
   * @param req
   */
  getBrowserInfo(req: Request): string {
    return req.header['user-agent'] || 'XX';
  }

  /**
   * extracts country of origin from request header
   * @param req
   */
  getCountry(req: Request): string {
    return req.header['cf-ipcountry'] ? req.header['cf-ipcountry'] : 'XX';
  }

  /**
   *
   * @param text
   */
  encryptText(text: string): string {
    return this.crypt.encrypt(text);
  }
}
