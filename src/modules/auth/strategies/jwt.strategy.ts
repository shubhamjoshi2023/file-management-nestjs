import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ProjectRepository } from '../repositories/project.repository';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly configService: AppConfigService,
    private readonly projectRepository: ProjectRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: any) {
    const project = await this.projectRepository.findByCode(payload.username);
    if (!project) {
      return {
        projectCode: payload.username,
        isAdmin: payload.isAdmin,
      };
    }

    return {
      projectCode: payload.username,
      projectId: project.id,
      isAdmin: project.isAdmin,
    };
  }
}
