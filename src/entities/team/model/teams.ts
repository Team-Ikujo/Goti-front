import stadiumImgKia from '@/shared/ui/image/image 195.png';
import mapImgKia from '@/shared/ui/image/스크린샷 2026-02-10 오전 9.48.52 1.png';
const stadiumImgSamsung = '/images/삼성 홈구장 외관.jpeg';
const mapImgSamsung = '/images/삼성 위치.png';
import type { Team } from "./types";

export const teams: Team[] = [
  {
    id: "samsung",
    name: "삼성 라이온즈",
    logoSrc: "/baseball/logos/samsung.png",
    logoAspectClassName: "aspect-[1280/962]",
    isEnabled: true,
    serverTeamId: "412cfc77-2c5d-4583-8e79-968339223864",
    teamCode: "SS",
    stadiumName: "대구",
    stadiumGuide: {
      stadiumImageSrc: stadiumImgSamsung,
      mapImageSrc: mapImgSamsung,
      info: [
        { label: '구장명', value: '대구 삼성 라이온즈 파크' },
        { label: '주소', value: '대구광역시 수성구 야구전설로 1' },
        { label: '좌석수', value: '관람석 24,000석' },
        { label: '총면적', value: '107,000㎡' },
        { label: '규모', value: '지상 5층' },
        { label: '펜스', value: '좌·우 100m, 중 122m' },
        { label: '특징', value: '국내 최대 규모 야구장' },
      ],
      busStops: [
        {
          name: '수성알파시티역 5번출구 (경산 방면)',
          buses: [
            { type: '간선', routes: '309, 349, 609, 937' },
            { type: '지선', routes: '399, 509, 990, 991, 수성3' },
          ],
        },
        {
          name: '수성알파시티역 1번출구 (시내 방면)',
          buses: [
            { type: '간선', routes: '309, 609, 649, 937' },
            { type: '지선', routes: '399, 509, 991, 수성3' },
          ],
        },
        {
          name: '수성못역 (수성못로)',
          buses: [
            { type: '간선', routes: '349, 618, 649' },
            { type: '지선', routes: '수성1, 수성3' },
          ],
        },
      ],
    },
  },
  {
    id: "kia",
    name: "KIA 타이거즈",
    logoSrc: "/baseball/logos/kia.png",
    logoAspectClassName: "aspect-[1280/954]",
    isEnabled: true,
    serverTeamId: "e5f58f8c-fcde-4017-8033-d8deb34fd4a2",
    teamCode: "KIA",
    stadiumName: "광주",
    stadiumGuide: {
      stadiumImageSrc: stadiumImgKia,
      mapImageSrc: mapImgKia,
      info: [
        { label: '구장명', value: '광주 - 기아 챔피언스 필드' },
        { label: '주소', value: '광주 북구 서림로 10' },
        { label: '좌석수', value: '관람석 20,500석' },
        { label: '총면적', value: '57,646㎡' },
        { label: '규모', value: '지하 2층 지상 5층' },
        { label: '펜스', value: '좌 · 우 99m, 중 121m' },
        { label: '특징', value: '국내 최초 개방형 야구장' },
      ],
      busStops: [
        {
          name: '광주기아챔피언스필드 (서림로)',
          buses: [
            { type: '간선', routes: '매월16' },
            { type: '지선', routes: '일곡38, 운림51, 용전84, 첨단95' },
          ],
        },
        {
          name: '무등야구장 (무등로)',
          buses: [
            { type: '간선', routes: '228' },
            { type: '지선', routes: '일곡38, 임곡89, 송정98' },
          ],
        },
        {
          name: '광주기아챔피언스필드입구 (무등로)',
          buses: [
            { type: '간선', routes: '228' },
            { type: '지선', routes: '금남58, 임곡89, 송정98' },
          ],
        },
      ],
    },
  },
  {
    id: "lg",
    name: "LG 트윈스",
    logoSrc: "/baseball/logos/lg.png",
    logoAspectClassName: "aspect-[1280/1023]",
    isEnabled: false,
    serverTeamId: "f44d1e89-e2fe-40e7-a587-1157d7a9c80a",
    teamCode: "LG",
  },
  {
    id: "hanwha",
    name: "한화 이글스",
    logoSrc: "/baseball/logos/hanwha.png",
    logoAspectClassName: "aspect-[1280/1065]",
    isEnabled: false,
    serverTeamId: "34159d27-2497-44d4-a4a2-c461dc3585c8",
    teamCode: "HH",
  },
  {
    id: "ssg",
    name: "SSG 랜더스",
    logoSrc: "/baseball/logos/ssg.png",
    logoAspectClassName: "aspect-[1280/754]",
    isEnabled: false,
    serverTeamId: "c33af471-d869-4af1-9b68-d085472e4408",
    teamCode: "SSG",
  },
  {
    id: "nc",
    name: "NC 다이노스",
    logoSrc: "/baseball/logos/nc.png",
    logoAspectClassName: "aspect-[1280/862]",
    isEnabled: false,
    serverTeamId: "72c57b65-9f68-4b6e-b9e3-2ec9074861f6",
    teamCode: "NC",
  },
  {
    id: "kt",
    name: "KT wiz",
    logoSrc: "/baseball/logos/kt.png",
    logoAspectClassName: "aspect-[1280/1158]",
    isEnabled: false,
    serverTeamId: "1e4022c6-3887-44f6-b510-d98aad5a4192",
    teamCode: "KT",
  },
  {
    id: "lotte",
    name: "롯데 자이언츠",
    logoSrc: "/baseball/logos/lotte.png",
    logoAspectClassName: "aspect-[1280/961]",
    isEnabled: false,
    serverTeamId: "d7b12b0f-c69d-4a7f-badc-04226daabb5f",
    teamCode: "LOT",
  },
  {
    id: "doosan",
    name: "두산 베어스",
    logoSrc: "/baseball/logos/doosan.png",
    logoAspectClassName: "aspect-[1280/1280]",
    isEnabled: false,
    serverTeamId: "d64b4220-6479-4e77-986a-f52447a433a6",
    teamCode: "DO",
  },
  {
    id: "kiwoom",
    name: "키움 히어로즈",
    logoSrc: "/baseball/logos/kiwoom.png",
    logoAspectClassName: "aspect-[1280/940]",
    isEnabled: false,
    serverTeamId: "520af775-e84b-4112-aa02-18ed1a6c8458",
    teamCode: "KIW",
  },
];
