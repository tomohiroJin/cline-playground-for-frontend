/**
 * ガイドセクション: チーム・チームタイプ関連
 */
import React, { useState } from 'react';
import { COLORS, FONTS } from '../../../constants';
import { TEAM_TYPES } from '../../../team-classifier';
import { AQS_IMAGES } from '../../../images';
import { CHARACTER_PROFILES } from '../../../character-profiles';
import { SectionBox, SectionTitle } from '../../styles';
import { ImageWithFallback } from './ImageWithFallback';

/** チームメンバーセクション */
export const TeamSection: React.FC = () => {
  const [bannerError, setBannerError] = useState(false);

  return (
    <SectionBox>
      <SectionTitle>TEAM</SectionTitle>
      {AQS_IMAGES.characters.team && !bannerError ? (
        <img
          src={AQS_IMAGES.characters.team}
          alt="チームバナー"
          onError={() => setBannerError(true)}
          style={{ width: '100%', height: 'auto', borderRadius: 8, marginBottom: 12 }}
        />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHARACTER_PROFILES.map((char) => {
          const imgSrc = AQS_IMAGES.characters[char.id as keyof typeof AQS_IMAGES.characters];
          return (
            <div
              key={char.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px',
                background: `${char.color}08`,
                borderRadius: 10,
                border: `1px solid ${char.color}22`,
                alignItems: 'flex-start',
              }}
            >
              <ImageWithFallback
                src={imgSrc}
                alt={char.name}
                emoji={char.emoji}
                size={52}
                borderColor={char.color}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: char.color, marginBottom: 2 }}>
                  {char.emoji} {char.name}
                </div>
                <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 6, fontFamily: FONTS.mono }}>
                  {char.role}
                </div>
                <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.6, marginBottom: 6 }}>
                  {char.personality}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                  {char.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 3,
                        background: `${char.color}15`, color: char.color,
                        border: `1px solid ${char.color}22`,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: char.color, fontStyle: 'italic', lineHeight: 1.5 }}>
                  {char.catchphrase}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionBox>
  );
};

/** チームタイプセクション */
export const TeamTypesSection: React.FC = () => (
  <SectionBox>
    <SectionTitle>TEAM TYPES</SectionTitle>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {TEAM_TYPES.map((type) => {
        const imgSrc = AQS_IMAGES.types[type.id as keyof typeof AQS_IMAGES.types];
        return (
          <div
            key={type.id}
            style={{
              display: 'flex', gap: 12, padding: '12px',
              background: `${type.color}08`, borderRadius: 10,
              border: `1px solid ${type.color}22`, alignItems: 'center',
            }}
          >
            <ImageWithFallback
              src={imgSrc}
              alt={type.name}
              emoji={type.emoji}
              size={52}
              borderColor={type.color}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: type.color, marginBottom: 4 }}>
                {type.name}
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>
                {type.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </SectionBox>
);
