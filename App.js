/**
 * CRV LAGOA — Visitas Leiteiras  (Expo Snack v8)
 *
 * Como usar (arquivo unico):
 * 1. Acesse https://snack.expo.dev
 * 2. Cole TODO este codigo no App.js
 * 3. Salve (Ctrl+S)
 * 4. Clique em "My Device" e escaneie o QR Code com o Expo Go
 *
 *
 * Credenciais de teste:
 *   Tecnico: cesar@crv4all.com.br     / 123456  (Cesar Oliveira)
 *   Tecnico: erica@crv4all.com.br     / 123456  (Erica Fonseca)
 *   Tecnico: henrique@crv4all.com.br  / 123456  (Henrique Froehlich)
 *   Tecnico: leandro@crv4all.com.br   / 123456  (Leandro Teixeira)
 *   Gestor:  gestor@crv4all.com.br    / 123456  (Felipe Prestes)
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Switch,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, BackHandler, StatusBar, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// ─────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────

// Paleta azul royal (CRV Lagoa)
const C = {
  green:      '#1a3c7a',   // azul royal principal
  greenDark:  '#0d1f4a',   // azul escuro
  greenLight: '#eef2fb',   // azul muito claro (fundo)
  white:      '#ffffff',
  border:     '#c5d0e8',
  muted:      '#4a5c82',
  error:      '#b3261e',
  errorBg:    '#fdecea',
  gold:       '#d4a843',   // dourado LAGOA+
};

const STATUS_BAR_HEIGHT = (() => {
  if (Platform.OS !== 'android') return 44;
  try {
    return StatusBar.currentHeight || 50;
  } catch {
    return 50;
  }
})();

const CLIENT_TYPES = ['B', 'C', 'Conexao Leite', 'KAM', 'Lagoa+'];

const SERVICE_TYPES = [
  'Clarifide Go', 'Curso IA', 'Coleta Herd', 'Entrega Herd',
  'Indicacao Touro', 'Prospec', 'Prospec Lagoa+', 'SireMatch',
  'Visita Lagoa+', 'Venda Herd',
];

const SERVICOS_COM_ANIMAIS = ['SireMatch', 'Coleta Herd', 'Venda Herd'];

const AREAS = ['011', '012', '013', '014', '015', '018', '019', '020'];

const MONTHS = [
  { label: 'Set/25', value: '8-2025' }, { label: 'Out/25', value: '9-2025' },
  { label: 'Nov/25', value: '10-2025' }, { label: 'Dez/25', value: '11-2025' },
  { label: 'Jan/26', value: '0-2026' }, { label: 'Fev/26', value: '1-2026' },
  { label: 'Mar/26', value: '2-2026' }, { label: 'Abr/26', value: '3-2026' },
];

const CONSULTORES = {
  '011': [
    'ELVIS G S LOPES', 'FERNANDO HENRIQ', 'FRANCISCO HENRI', 'FREDERICO ARANT', 'GIVANILDO JACIN',
    'JEFFERSON', 'JEFFERSON DOS S', 'JOAO MACHADO', 'JUAREZ', 'JUSCELIO RAIMUN',
    'LEANDRO VILELLA', 'LEONARDO TUFI', 'LUCAS DUARTE', 'LUCAS GONCALVES', 'LUCAS SIQUEIRA',
    'LUIS HUMBERTO R', 'MURILO CANEDO', 'PAULO GARCIA SI', 'PAULO SOUSA', 'RAFAEL AUGUSTO',
    'RICARDO BONATO', 'VILTON MODESTO', 'VINICIUS JOSE', 'VINICIUS MARTIN', 'VIRGILIO RODRIG',
    'WILLY JOSE DE', 'WILSON VAGNER V',
  ],
  '012': [
    'ANNY QUEIROZ SI', 'BRUNO FONSECA', 'CARLOS (SP)', 'CEZAR', 'EDUARDO SOARES',
    'FABIO PACHECO', 'FELIPE SCARDUA', 'FERNANDO MOREIR', 'HUGO LEONARDO', 'JOAO ANT GUEDES',
    'JOAO PEDRO MELO', 'JOSE RAIMUNDO', 'LEONARDO SOARES', 'LUCAS VALERIANO', 'LUCIANO FERREIR',
    'LUIS HENRIQUE', 'MARIO CEZAR', 'MAYCON CEZAR', 'MIGUEL HADDAD', 'RODRIGO LIMA',
    'RODRIGO PIVARI', 'RONALD DIAS TRO', 'VITOR', 'WLADIMIR LEON',
  ],
  '013': [
    'ALEXANDRE MAZZO', 'DALTON LUIZ DE', 'FELIPE GUIZELIN', 'FERNANDO MANICA', 'JOSE ROB RANGEL',
    'JOSE ROSA FILHO', 'LEANDRO PAVANEL', 'LEONARDO GODOY', 'MARCEL BERTONHA', 'MARINA PIPERAS',
    'MARLON COSTA', 'NAUR SOUZA', 'OSVADO DE LAB.J', 'PAULO CEZAR OLI', 'PAULO SERGIO G',
    'RAFAEL BRUNO', 'RAFAEL JOSE DE', 'RENATA', 'VALSAIR DE MATO', 'VINICIUS GABRIE',
    'WILSON MARIANO',
  ],
  '014': [
    'ALESSANDRO MAGN', 'ALEXANDRE TENOR', 'ANGELO ANTONELL', 'BRUNO CERQUEIRA', 'CELIO THEODORO',
    'DARLAN DORIGHET', 'ELMO', 'ELTON MATOS', 'EVERTON DO PATR', 'FERNANDO F.',
    'FRANCISCO OCTAV', 'GABRYEL TEIXEIR', 'GENILDO BORGES', 'ITAMAR', 'JAIR MILANEZI',
    'JALMIR DANIEL S', 'JOAO DIOGO NETO', 'JORGE GOMES', 'JOSE A TENORIO', 'JOSE C BAMBINI',
    'JOSE CLAUDIO', 'JUAREZ PEDRO DO', 'LAIR GABRIEL', 'MARCOS FIEL', 'NATALIA ANTONEL',
    'PAULO GUSTAVO', 'ROBERTO GREG.', 'ROBSON RODRIGUE', 'RODOLFO REIS AL', 'SINARA MARTINS',
    'THIAGO NOGUEIRA', 'UZIEL AMARAL', 'VALTER ALMEIDA', 'VITOR ALMEIDA',
  ],
  '015': [
    'ALEXANDRE CEZER', 'ANDRE SOLEK MAC', 'CLAITON', 'DENILSON SEIDEL', 'EDUARDO MONT.',
    'EDUARDO TOSHIHI', 'EMERSON HENRI', 'EVANDRO TELLES', 'FABIO (PR)', 'FILIPE ROPELATO',
    'GUILHERME ROCHA', 'JEAN MICHEL ROT', 'KEVELAN ALMEIDA', 'KOURBANY LUIZ C', 'LAUDEMIR',
    'LOURIAN TELEGIN', 'RAFAEL RUZA', 'RONALDO ROSA', 'VINICIUS MUCHIN',
  ],
  '018': [
    'ALEX BRANDALISE', 'ANDRES HAURERS', 'DARLAN CARLETI', 'DIEGO BORBA MUL', 'EDUARDO LUIZ',
    'EVANDRO', 'FRANCIANO', 'FREDERICO DE ME', 'FREDERICO GUERR', 'GUILHERME RODRI',
    'HUGO FILHO', 'JOAO THOMAZ', 'LEANDRO GRAFF', 'LUCAS RUAS', 'LUCIANO WEBER',
    'LUIS PANIZ', 'LUIZ AUGUSTO', 'LUIZ FELIPE', 'MARCELO BECKER', 'MARIANY DA PAIX',
    'MAURICIO PINTO', 'RENAN MARSARO', 'RENAN MOROSSINO', 'RICARDO MOREIRA', 'RODRIGO BORGES',
  ],
  '019': [
    'ADRIANO BOLOGNE', 'ADRIELLY LOPES', 'ALEXANDRE LOUZA', 'ANDRE HENRIQUE', 'BRENO DIAS',
    'CASSIO ROBERTO', 'DANIEL GUSTAVO', 'EDIVALDO BATIST', 'EDIVAN', 'EVANILDO NUNES',
    'FABER MONTEIRO', 'FABRICIO GARCES', 'GUSTAVO HENRIQU', 'IGOR/PAULO', 'IODOMIR CARVALH',
    'ISMAEL DOS SANT', 'MAYLON DIOGO', 'MOACIIR DUARTE', 'NICOLE COLUCCI', 'PAULO HENRIQUE',
    'RAI DAMASCENO E', 'RAYCON ROBERTO', 'RODRIGO ALMEIDA', 'WAGNER PESCA',
  ],
  '020': [
    'ALOYSIO FRANCA', 'ANDERSON JOSE', 'ANDRE CARREIRA', 'ARTHUR NEGRAO', 'CLAUDIO FELIPE',
    'DIEGO MOURA', 'EDUARDO FURTADO', 'FELIPE NAIS', 'GILMAR', 'GUSTAVO AMERICO',
    'GUSTAVO ANDRADE', 'JALES', 'JULIANO MACHADO', 'JUNIOR ALVES', 'LUCAS DE SOUSA',
    'LUCIANO ILTON', 'LUIZ HARLITON C', 'MARCELO CARNEIR', 'MARCOS VINICIUS', 'MAX MARIANO',
    'OLICIO BATISTA', 'PAULO BARROS', 'PAULO NASCIPE', 'RAAFAEL VERNER H', 'ROBSON DA SILVA',
    'RUBENS RUDRIGUE', 'THAYMISSON LIRA', 'THIAGO RESENDE',
  ],
};

// Tecnicos pre-cadastrados (aparecem ja na tela de Gerenciar Tecnicos)
const INITIAL_TECHS = [
  { id: 'tech-001', name: 'Cesar Oliveira',     area: '011', email: 'cesar@crv4all.com.br',    phone: '', login: 'cesar.oliveira',     createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'tech-002', name: 'Erica Fonseca',      area: '012', email: 'erica@crv4all.com.br',    phone: '', login: 'erica.fonseca',      createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'tech-003', name: 'Henrique Froehlich', area: '013', email: 'henrique@crv4all.com.br', phone: '', login: 'henrique.froehlich', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'tech-004', name: 'Leandro Teixeira',   area: '015', email: 'leandro@crv4all.com.br',  phone: '', login: 'leandro.teixeira',   createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'tech-005', name: 'Felipe Prestes',     area: '015', email: 'prestes@crv4all.com.br',  phone: '', login: 'felipe.prestes',     createdAt: '2026-01-01T00:00:00.000Z' },
];

const USERS = [
  { email: 'cesar@crv4all.com.br',    password: '123456', name: 'Cesar Oliveira',     role: 'tecnico', area: '011' },
  { email: 'erica@crv4all.com.br',    password: '123456', name: 'Erica Fonseca',      role: 'tecnico', area: '012' },
  { email: 'henrique@crv4all.com.br', password: '123456', name: 'Henrique Froehlich', role: 'tecnico', area: '013' },
  { email: 'leandro@crv4all.com.br',  password: '123456', name: 'Leandro Teixeira',   role: 'tecnico', area: '015' },
  { email: 'prestes@crv4all.com.br',  password: '123456', name: 'Felipe Prestes',     role: 'tecnico', area: '015' },
  { email: 'gestor@crv4all.com.br',   password: '123456', name: 'Felipe Prestes',     role: 'gestor',  area: null  },
];

const KEY = {
  SESSION: '@vl/session', CLIENTS: '@vl/clients',
  SCHEDULES: '@vl/schedules', VISITS: '@vl/visits', TECHS: '@vl/techs',
  INITIALIZED: '@vl/initialized_v10', PASSWORDS: '@vl/passwords',
};

const CHART_COLORS = [
  '#1a3c7a', '#2196F3', '#FF9800', '#9C27B0',
  '#F44336', '#00BCD4', '#d4a843', '#FF5722', '#607D8B', '#E91E63',
];

// -----------------------------------------
// HISTORICO DE VISITAS (1473 registros, set/25-abr/26)
// -----------------------------------------

const HISTORICO = [
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ROBERTO DANTAS VILAR SOBRINHO",n:110,t:"B",s:"SIREMATCH",na:110,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ADÃO DA SILVA",n:40,t:"C",s:"SIREMATCH",na:40,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"FRANCISCO REGIS FONTELENE",n:325,t:"B",s:"SIREMATCH",na:325,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JEAN DE PINHO MENDES",n:88,t:"B",s:"SIREMATCH",na:88,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ANTONIO FRANCISCO CARNEIRO",n:111,t:"B",s:"SIREMATCH",na:111,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JOSE GARCIA GOMES",n:83,t:"B",s:"SIREMATCH",na:83,m:"set-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ISIDRO ISOLENO CAMPOS GOMES",n:71,t:"B",s:"SIREMATCH",na:71,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Luiz Marcos Curcio",n:130,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO DE AVILA",n:60,t:"B",s:"COLETA HERD",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ROGERIO VICENTE BARBOSA",n:342,t:"LAGOA+",s:"COLETA HERD",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO DE AVILA",n:60,t:"B",s:"VISITA TÉCNICA",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"VITTO OTTONI",n:29,t:"C",s:"VISITA TÉCNICA",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Instituto Federal Triangulo Mineiro - Ubereba",n:40,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Humberto Renato",n:220,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Alexandre Honorato",n:120,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"FAZENDA TINOCO - LUCAS",n:500,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"FAZENDA BORGES - JOÃO PAULO",n:300,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"DIONES",n:130,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"ILSON",n:120,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VALDIMAR CAIXETA DA SILVA",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"PATRICIA",n:170,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"JULIO CESAR",n:40,t:"C",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"fazenda caixeta - Rodrigo",n:140,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Valto Machado",n:80,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Cabloca - Bruno",n:100,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Luiz Claudio",n:100,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Santos Reis - Rafael",n:150,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Rodrigo",n:125,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Estancia Soares",n:100,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"William Caixeta",n:400,t:"KAM",s:"ENTREGA HERD",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Jose Eustaquio Pereira Amorim",n:220,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Flavio - Fazenda Santa Cruz - Gurpo Colho",n:600,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"PLAESTRA",n:20,t:"FEIRA/EVENTO",s:"INDICAÇÃO TOURO",na:20,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VITOR CAIXETA",n:170,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"GUSTAVO MIGUEL SCHMIDT",n:144,t:"KAM",s:"SIREMATCH",na:144,m:"set-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"ERNANDO DA SILVA PEREIRA",n:95,t:"KAM",s:"SIREMATCH",na:95,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"CARLOS ALEXANDRE DE FIGUEIREDO",n:123,t:"KAM",s:"SIREMATCH",na:123,m:"set-25"},
{e:"Felipe Prestes",a:"15",c:"JEAN MICHEL ROTAVA",cl:"JOARI ANTONIO PALAVESINI",n:300,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"set-25"},
{e:"Felipe Prestes",a:"",c:"",cl:"CONVENÇÃO",n:0,t:"FEIRA/EVENTO",s:"FEIRA/EVENTO",na:0,m:"set-25"},
{e:"Felipe Prestes",a:"",c:"",cl:"HOME OFFICE",n:0,t:"HOME OFFICE",s:"HOME OFFICE",na:0,m:"set-25"},
{e:"Felipe Prestes",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ROBERTO BORG",n:3000,t:"KAM",s:"ENTREGA HERD",na:1,m:"set-25"},
{e:"Felipe Prestes",a:"15",c:"ADAO MARCOS MACHADO",cl:"MARCOS STEKLEIN",n:300,t:"KAM",s:"ENTREGA HERD",na:1,m:"set-25"},
{e:"Felipe Prestes",a:"",c:"",cl:"ESCRITÓRIO RP",n:0,t:"HOME OFFICE",s:"HOME OFFICE",na:3,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Ademir Castanho",n:80,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Adriano Wacherski",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Alfred Jonne Schuller",n:250,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Alisson Lara",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Amadeu Ubert",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Henk Boele Kassies",n:250,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Armando Rabbers",n:400,t:"KAM",s:"ENTREGA HERD",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Armando Rabbers",n:400,t:"KAM",s:"ENTREGA HERD",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bernadete Maria Bart",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bruno Oles Staron",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Cabanha Freitas",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Carlos Adão",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"JUNIOR JOAQUIM VILSON ALVES",n:50,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Cesar Klosterman",n:179,t:"KAM",s:"SIREMATCH",na:179,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Claudimar Cecchin",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Dowe Sibma",n:500,t:"KAM",s:"VENDA HERD",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Edilaine Madzgalla",n:27,t:"B",s:"SIREMATCH",na:27,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mario de Araujo Barbosa",n:400,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Eliane Steklain Schuhli",n:24,t:"B",s:"SIREMATCH",na:24,m:"dez-25"},
{e:"Phillippe Monteiro",a:"18",c:"ALEX BRANDALISE",cl:"ALEX BRANDALISE",n:150,t:"KAM",s:"COLETA HERD",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elias Hofman",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"ARI FOLETTO JUNIOR",n:800,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"FLAVIA BORTOLANÇA",n:150,t:"KAM",s:"PROSPEC",na:3,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"SILVANO TOIGO",n:150,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"CRISTIANO MARINHO",n:100,t:"KAM",s:"PROSPEC",na:2,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"ADENOR FINATTO",n:200,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA CAMBOATA",n:0,t:"KAM",s:"PROSPEC",na:3,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA CAMBOATA",n:400,t:"KAM",s:"PROSPEC",na:3,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"CLAUDECIR ANTONIO LUNARDI",n:80,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"FAZENDA ARSEGO",n:2500,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"JAQUISON CIZERÇA",n:500,t:"KAM",s:"PROSPEC",na:2,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA ARTIFON",n:0,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"CEZAR JUNIOR SCANAGATTA",n:120,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"ASSET ACESSORIA VETERINARIA",n:500,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA ARTIFON",n:0,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"PREFEITURA NOVO XINGU/RS",n:0,t:"FEIRA/EVENTO",s:"PROSPEC",na:2,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"PREFEITURA NOVO XINGU/RS",n:0,t:"FEIRA/EVENTO",s:"PROSPEC",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Elielson Carneiro",n:200,t:"LAGOA+",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"IVONEI SOPELSA",n:80,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"GILVONEI COLO",n:80,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"EDGAR PAVAM",n:300,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"JAIRO COMIM",n:200,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"RIVANILDO JULIAN",n:180,t:"KAM",s:"PROSPEC",na:2,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"SILVANO GALON",n:80,t:"B",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"LUDOVICO TOZO AGROPECUARIA",n:500,t:"KAM",s:"PROSPEC",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GELSON JOSE DA SILVEIRA",n:105,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AMARILDO YUNG",n:40,t:"C",s:"PROSPEC",na:1,m:"set-25"},
{e:"Suelen Soares",a:"12",c:"CEZAR VON ZUBEN",cl:"PREFEITURA DO CAMPUS USP FERNANDO COSTA",n:178,t:"KAM",s:"SIREMATCH",na:178,m:"set-25"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"MARCIO JOSE DE ARAUJO GIMENES",n:59,t:"B",s:"SIREMATCH",na:59,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"FRANCIANO BLANC ALVES",cl:"PAULO RECHMANN",n:96,t:"KAM",s:"SIREMATCH",na:96,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"FRANCIANO BLANC ALVES",cl:"LAIR OBERGER",n:102,t:"KAM",s:"SIREMATCH",na:102,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"BRUNO SCHLICKMANN",n:53,t:"B",s:"SIREMATCH",na:53,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"DIONISIO CONZATTI",n:24,t:"C",s:"SIREMATCH",na:24,m:"set-25"},
{e:"Suelen Soares",a:"15",c:"MAICON PUERTAS SORRILHA SILVA",cl:"LUIZ CARLOS DA SILVA",n:104,t:"KAM",s:"SIREMATCH",na:104,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ANDREI BUSNELLO",n:53,t:"B",s:"SIREMATCH",na:53,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Afonso/ Fazenda São Rafael",n:200,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ROBERTO MEINDERT BORG",n:4994,t:"KAM",s:"SIREMATCH",na:1602,m:"set-25"},
{e:"Suelen Soares",a:"14",c:"UZIEL ALMEIDA AMARAL",cl:"MAURO MUIÑOS DE ANDRADE",n:29,t:"C",s:"SIREMATCH",na:29,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ODIRLEY ANTONIO MORETTO",n:26,t:"C",s:"SIREMATCH",na:26,m:"set-25"},
{e:"Suelen Soares",a:"18",c:"KOURBANY LUIZ CORDEIRO DA CRUZ",cl:"ALEXANDRE JOSE SCHULIS",n:56,t:"B",s:"SIREMATCH",na:56,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Elielson Carneiro",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"CABANHA GEMA",n:150,t:"KAM",s:"COLETA HERD",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elisabeth Erthal",n:160,t:"LAGOA+",s:"SIREMATCH",na:160,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elizabet Ertal",n:155,t:"LAGOA+",s:"SIREMATCH",na:155,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Emilio Schareatner",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Eudimir Copetti",n:100,t:"KAM",s:"PROSPEC",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Eudinelli Copeti",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Fabiano Hoffman Schuster",n:81,t:"KAM",s:"SIREMATCH",na:81,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Fabiano Hoffman Schuster",n:81,t:"KAM",s:"SIREMATCH",na:81,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Fabio Bavoso",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Flavio Antunes",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Francisco Prestes Carneiro",n:200,t:"KAM",s:"VENDA HERD",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Eduardo Linhares Tonon",n:250,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gilmar Arthur Carneiro",n:50,t:"KAM",s:"SIREMATCH",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Helio Hents",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Helio Roberto de Oliveira",n:294,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Sybren de Jong",n:400,t:"LAGOA+",s:"PROSPEC LAGOA +",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JACSON WILLIAN BORSTMANN SCHMITT",n:292,t:"LAGOA+",s:"ENTREGA HERD",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Henk Boele Kassies",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Henk Boele Kassies",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Henrique Schmidt Steklain",n:165,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Hugo Fitikau",n:700,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Igor Copetti",n:80,t:"B",s:"SIREMATCH",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:266,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:266,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:266,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:354,t:"KAM",s:"SIREMATCH",na:354,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:295,t:"KAM",s:"SIREMATCH",na:295,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:295,t:"KAM",s:"SIREMATCH",na:295,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:150,t:"KAM",s:"ENTREGA HERD",na:3,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:250,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"ERNANDO DA SILVA PEREIRA",n:120,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:343,t:"LAGOA+",s:"SIREMATCH",na:343,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan Herrit",n:350,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CLAIRTON LANGE",n:50,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"FELIPE FLOSS",n:123,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"GUILHERME RODRIGUES",cl:"ZELI LECH",n:70,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"GUILHERME RODRIGUES",cl:"CLEITON SIEBERT",n:30,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"GUILHERME RODRIGUES",cl:"CLEITON SIEBERT",n:30,t:"C",s:"SIREMATCH",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"BRUNA RIGON",n:80,t:"B",s:"INDICAÇÃO TOURO",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"LUIZ  ATILIO DAGOSTINI MURARO",n:30,t:"C",s:"SIREMATCH",na:1,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AMARILDO YUNG",n:30,t:"C",s:"SIREMATCH",na:1,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"EFAPI",n:0,t:"FEIRA/EVENTO",s:"PROSPEC",na:1,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA CAMBOATA",n:0,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"AGROPECUARIA ARTIFON",n:0,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"RAFAEL STOCKER",n:80,t:"B",s:"ENTREGA HERD",na:3,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ALCIDE BIN",n:60,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"01/10/2025"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JACSON WILLIAN BORSTMANN SCHMITT",n:300,t:"LAGOA+",s:"VENDA HERD",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"CHARLES ANDRE DE OLIVEIRA",n:80,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"VITOR KLOCK",n:50,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ALTAIR MATICK",n:95,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"SAMUEL MANSKE",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ROGERIO LUIZ PETRY",n:130,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"VANIR KNAPP",n:131,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"RUDIBERTO DIESEL",n:132,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"CABANHA GEMA",n:150,t:"KAM",s:"PROSPEC",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ELCIO EURIDES WIESENHUTTER",n:50,t:"C",s:"SIREMATCH",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ERNANI EUCLIDES BAMBERG MAUER",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JACSON WILLIAN BORSTMANN SCHMITT",n:292,t:"KAM",s:"SIREMATCH",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ROGERIO LUIZ PETRY",n:56,t:"KAM",s:"COLETA HERD",na:3,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JOÃO CARLOS BECKER",n:45,t:"C",s:"SIREMATCH",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"LATICINIO DAH RÊ",n:500,t:"CONEXÃO LEITE",s:"PROSPEC",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"LATICINIO DOCEOLI",n:10000,t:"CONEXÃO LEITE",s:"PROSPEC",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"LUCAS CARDOSO",n:500,t:"KAM",s:"PROSPEC",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"SAMUEL MANSKE",n:0,t:"KAM",s:"COLETA HERD",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"ERNANDO DA SILVA PEREIRA",n:120,t:"KAM",s:"COLETA HERD",na:34,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Sidney Lopes da Fonseca",n:40,t:"C",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"CARLOS VIEIRA ROSA",n:105,t:"KAM",s:"COLETA HERD",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"CARLINHOS MATHEUS WILLERS",n:60,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"MARCOS SOUZA DE FREITAS",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"TIAGO RAFAEL ROCKENBACH",n:68,t:"B",s:"VENDA HERD",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JOSE  MADKER",n:200,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"Phillippe Monteiro",a:"18",c:"",cl:"HOME OFFICE",n:0,t:"C",s:"HOME OFFICE",na:1,m:""},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"EDUARDA CAGNONI",n:60,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"JOSE FICHINA",n:150,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUIZ PESSONI",n:250,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUCIANA CARVALHO COUTO ROSA",n:160,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"HUMBERTO PIMENTA LATARO",n:150,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:4,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"JOAO BATISTA LATARO",n:90,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"PEDRO HENRIQUE CAMPOLONGO",n:70,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"MARCOS TONIN",n:60,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"EVERTON FERRUGEM SÃO JULIÃO",n:130,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GERALDO ALVARENGA REZENDE",n:90,t:"C",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"KLIESMANN GARCEZ PIMENTA LATARO",n:30,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"JOAO HENRIQUE CALIXTO DE SOUZA",n:30,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"PAULO CESAR SANTANA",n:40,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"ALCINO BERNARDO CARNEIRO",n:0,t:"B",s:"SIREMATCH",na:35,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"LUIS FERNANDO DOS SANTOS",n:0,t:"B",s:"SIREMATCH",na:46,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"NILTON CEZAR ZACARIAS",n:0,t:"B",s:"SIREMATCH",na:40,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"DEBORA ROZILDA SERVIGNANI",n:0,t:"B",s:"SIREMATCH",na:40,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"CHARLES HENRIQUE RODRIGUES LIMA",n:0,t:"B",s:"SIREMATCH",na:15,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"ISMAEL NONATO JUNIOR",n:0,t:"C",s:"SIREMATCH",na:170,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"AGNALDO SERAFIN",n:0,t:"B",s:"SIREMATCH",na:40,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"MAMED FAITARONE RIBEIRO",n:0,t:"C",s:"SIREMATCH",na:60,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"LUCIA HELENA RIBEIRO LIMA DA CUNHA",n:0,t:"C",s:"SIREMATCH",na:80,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"ILTON DE BRITO VILAS BOAS",n:0,t:"C",s:"SIREMATCH",na:60,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"ANTONIO CELSO SCHIAVO",n:0,t:"B",s:"SIREMATCH",na:40,m:"out-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"FLAVIA PERPETUO PILOTO CARDOSO",n:0,t:"B",s:"SIREMATCH",na:50,m:"out-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JOSE ERNAILTON DE CARVALHO",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ANTONIO JOSE DE ALMEIDA",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JOAQUIM BEZERRA GOMES",n:70,t:"C",s:"SIREMATCH",na:70,m:"out-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"FRANCISCO REGIS FONTELENE",n:320,t:"KAM",s:"SIREMATCH",na:320,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"CEZAR VON ZUBEN",cl:"QUINTA DOS MENDES AGROPASTORIL",n:119,t:"KAM",s:"SIREMATCH",na:119,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JANICE KOGLER",n:54,t:"B",s:"SIREMATCH",na:54,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"HUGO LEONARDO LOURENCO DOS REIS",cl:"GLAUTER RODRIGUES GOULART",n:467,t:"KAM",s:"SIREMATCH",na:467,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"AMILTON GERALDO PEREIRA",n:135,t:"KAM",s:"SIREMATCH",na:135,m:"out-25"},
{e:"Suelen Soares",a:"11",c:"CEZAR VON ZUBEN",cl:"PAULO JOSÉ MATTA DE REZENDE FILHO",n:76,t:"B",s:"SIREMATCH",na:76,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"KOURBANY LUIZ CORDEIRO DA CRUZ",cl:"BATISTA BLASIUS",n:276,t:"KAM",s:"SIREMATCH",na:276,m:"out-25"},
{e:"Suelen Soares",a:"11",c:"FERNANDO HENRIQUE MENDONÇA",cl:"RONALDO MODESTO",n:21,t:"C",s:"SIREMATCH",na:21,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"KOURBANY LUIZ CORDEIRO DA CRUZ",cl:"AGRO PASTORIL YBAKATU LTDA ME",n:40,t:"C",s:"SIREMATCH",na:40,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"JAIME COTOVICZ",n:450,t:"KAM",s:"SIREMATCH",na:450,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ROBERTO MEINDERT BORG",n:1604,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:1604,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"SYBREN DE JONG",n:427,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:427,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"DEMETRIO SILVA DOS SANTOS",n:69,t:"KAM",s:"ATUALIZAÇÃO HERD",na:30,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"RICARDO BACKES",n:66,t:"KAM",s:"ATUALIZAÇÃO HERD",na:66,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ILMO VON GRAFEN",n:176,t:"KAM",s:"ATUALIZAÇÃO HERD",na:59,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"VILSON ROCHA DE ALMEIDA",n:531,t:"KAM",s:"ATUALIZAÇÃO HERD",na:451,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CELSO LAZARETTI",n:113,t:"KAM",s:"ATUALIZAÇÃO HERD",na:49,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EDUARDO KUNTZER",n:284,t:"KAM",s:"ATUALIZAÇÃO HERD",na:214,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ADEMIR FERRI DE SIQUEIRA",n:189,t:"KAM",s:"ATUALIZAÇÃO HERD",na:80,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"INSTITUTO FARROUPILHA",n:36,t:"KAM",s:"ATUALIZAÇÃO HERD",na:36,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CLEO DE BORTOLI",n:45,t:"KAM",s:"ATUALIZAÇÃO HERD",na:28,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CLAUDIO SADI GONCHOROSKI",n:109,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:60,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"AVANIR DE OLIVEIRA",n:133,t:"KAM",s:"ATUALIZAÇÃO HERD",na:133,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"JACOB LEONARD VOORSLUYS",n:673,t:"KAM",s:"ATUALIZAÇÃO HERD",na:278,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"DOUWE ALBERT SIBMA",n:784,t:"KAM",s:"ATUALIZAÇÃO HERD",na:745,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"VALDEMAR GRAMMS",n:72,t:"KAM",s:"ATUALIZAÇÃO HERD",na:33,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"ROBERTO HANEL",n:30,t:"KAM",s:"ATUALIZAÇÃO HERD",na:30,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"LUIZ CARLOS CAVANUS",n:152,t:"KAM",s:"ATUALIZAÇÃO HERD",na:56,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"CELSO PETTER",n:558,t:"KAM",s:"ATUALIZAÇÃO HERD",na:199,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"TANIO ELIEZER ALVES",n:243,t:"KAM",s:"ATUALIZAÇÃO HERD",na:194,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"MAYCON CEZAR DE OLIVEIRA",cl:"EDSON TEIXEIRA DA SILVA",n:425,t:"KAM",s:"ATUALIZAÇÃO HERD",na:425,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"CLAUDIO APARECIDI DE SOUZA",n:38,t:"KAM",s:"ATUALIZAÇÃO HERD",na:22,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"CEZAR VON ZUBEN",cl:"JOÃO ROBERTO MIGLIARI LEMBI",n:692,t:"KAM",s:"ATUALIZAÇÃO HERD",na:692,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"JAIR SEBASTIÃO CARNEIRO",n:343,t:"KAM",s:"ATUALIZAÇÃO HERD",na:70,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"PAULO  EDUARDO LINHARES TONON",n:354,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:354,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"SIDINEI MARCOS MULLER",n:97,t:"KAM",s:"ATUALIZAÇÃO HERD",na:97,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"MARCOS STEKLAIN",n:281,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:260,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO DE AVILA CARVALHO",n:101,t:"KAM",s:"ATUALIZAÇÃO HERD",na:20,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"MARIUS CORNELIUS BRONKHORST",n:1448,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:10,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"LATICINIO GRANJA CICHELERO LTDA",n:608,t:"KAM",s:"ATUALIZAÇÃO HERD",na:451,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"AVANIR DE OLIVEIRA",n:133,t:"KAM",s:"ATUALIZAÇÃO HERD",na:133,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"GEAN SCHILIQMAN",n:50,t:"B",s:"ATUALIZAÇÃO HERD",na:50,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"TIAGO COELHO",n:16,t:"C",s:"ATUALIZAÇÃO HERD",na:8,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"CRISTIANO PALUDO",n:109,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:62,m:"out-25"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ROGERIO VICENTE",n:336,t:"KAM",s:"ATUALIZAÇÃO HERD",na:50,m:"out-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ARMANDO RABBERS",n:520,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:520,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ALCIDES RACHE",n:42,t:"C",s:"SIREMATCH",na:42,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"LAUDEMIR LEITES",cl:"EUGENIO MARCELINO PIZZOLATTO",n:557,t:"KAM",s:"SIREMATCH",na:557,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"INERI CENCI",n:69,t:"B",s:"SIREMATCH",na:69,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MARIANA BEVILACQUA",n:27,t:"C",s:"SIREMATCH",na:27,m:"out-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GELSON JOSE DA SILVEIRA",n:44,t:"C",s:"SIREMATCH",na:44,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Treinamento Pratico equipe Alto Paranaíba",n:0,t:"C",s:"VISITA TÉCNICA",na:3,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Reunião Coopatos - Conexão Leite",n:0,t:"KAM",s:"VISITA TÉCNICA",na:3,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fernando Peres",n:1000,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"JOÃO PAULO - Patrocinio",n:50,t:"B",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Eunice Guimarães",n:200,t:"B",s:"PROSPEC",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Leno - Fazenda Fortaleza",n:60,t:"B",s:"PROSPEC",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Gustavo de Oliveira Rodrigues",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Otom",n:200,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS BERNADO R. M. SILVA",n:100,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS EDUARDO DURCERCINO DA SILVA",n:200,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"José Adelmo Lino",n:100,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Vilson Rodrigues da Silva Jr",n:10,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Antonio Cardoso",n:150,t:"LAGOA+",s:"SIREMATCH",na:2,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"HUGO LEONARDO LOURENCO DOS REIS",cl:"GLAUTER RODRIGUES GOULART",n:600,t:"LAGOA+",s:"COLETA HERD",na:100,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan Petter",n:400,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"GUSTAVO MIGUEL SCHMIDT",n:150,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"11",c:"JOAO MACHADO PRATA NETO",cl:"Joaquim Anibal Carvalho Andrade",n:100,t:"KAM",s:"SIREMATCH",na:25,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan Petter",n:400,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"HUGO LEONARDO LOURENCO DOS REIS",cl:"Paulo Cau",n:1000,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"ALFREDO GUIMARAES JUNIOR",n:260,t:"KAM",s:"SIREMATCH",na:14,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"Rodrigo Mendes Moreira",n:60,t:"KAM",s:"SIREMATCH",na:41,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"GUILHERME JORGE D. SANTOS",n:40,t:"B",s:"SIREMATCH",na:27,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"PALESTA NA UNIVERSO - JUIZ DE FORA",n:0,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:43,m:"out-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"HENRIQUE FILHO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIO JOSE FRANÇA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALMIR ROGERIO BERTUSSE",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NILDOMAR GUSMAO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSE PROCOPIO SOBRINHO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCELO VIEIRA NETO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSE CARLOS NICHESK",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CARLOS ANTONIO PROCOPIO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:3,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUIZ CARLOS MACRON",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"IVANILDO SEECHIS",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ELISON RODRIGO SANTANA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSÉ DREHER",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CELIO RICARDO GOETZ",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARLI DE LIMA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"PEDRO ROCHA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIA ROCHA RODRIGUES",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALDO JULIO DE AQUINO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"AILTON CASTRO SILVA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARIA APARECIDA FERNANDES",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EREVALDO AP. CARVALHO",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOCIMAR JOSE DE SOUZA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUIZ GONCALVES DA SILVA",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JUSCILENE CAMPOS",n:0,t:"CONEXÃO LEITE",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"JOCELENE LESKI KLOSTERMANN",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Marcio Brino",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Pedro Gomes",n:100,t:"KAM",s:"VENDA HERD",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"RICARDO MENEZES GARCIA",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Rogério Weber",n:50,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"WILLIAM JOSE CAIXETA",n:350,t:"LAGOA+",s:"SIREMATCH",na:147,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JORGE HENRIQUE DA SILVA COSTA",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"DAVID EMANUEL PRANDINI PRADO",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"ROGERIO FRIAS HEGUEDUSCH",n:70,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"PEDRO MANOEL DE SOUZA NEVES",n:70,t:"C",s:"SIREMATCH",na:70,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"PIERRE ANDERSON DE OLIVEIRA",n:45,t:"C",s:"SIREMATCH",na:45,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"MARCIO LUIZ TOMAZINI",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"JOSE GABRIEL BATISTA DE OLIVEIRA",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"ANDRE SANTOS DIAS",n:55,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LEONARDO LUIS CERISE JUNIOR",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"DECIO ALEIXO SANDRIN",n:75,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"AGROPECUARIA FAZENDA BOA VISTA",n:110,t:"KAM",s:"SIREMATCH",na:110,m:"nov-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ROBERTO REGIS VELLUDO MACEDO FILHO",n:15,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"João Lourival Batista",n:70,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"César Oliveira",a:"12",c:"CARLOS ALBERTO RODRIGUES DE OLIVEIRA",cl:"LUIZ MIGUEL SEGALA",n:45,t:"C",s:"SIREMATCH",na:45,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"PALESTRA DIA DO LEITE - IFMG/campus Bambuí",n:0,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:300,m:"nov-25"},
{e:"Érica Fonseca",a:"11",c:"JOAO MACHADO PRATA NETO",cl:"CONGRESSO INTERNACIONAL DO GIROLANDO",n:0,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:500,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LUCIANO FERREIRA PEREIRA",cl:"GUILHERME ARANTES ROSA MACIEL",n:120,t:"KAM",s:"PROSPEC",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LUCIANO FERREIRA PEREIRA",cl:"JOSE MARIA TEXEIRA GUIMARAES",n:170,t:"KAM",s:"PROSPEC",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LUCIANO FERREIRA PEREIRA",cl:"TREINAMENTO DO VENDEDOR CICERO",n:1,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"PAULO MELLO",n:300,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"REUNIÃO APRESENTAÇÃO CONEXÃO LEITE - ITALAC",n:0,t:"CONEXÃO LEITE",s:"PROSPEC",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"MARCONI",n:120,t:"LAGOA+",s:"ENTREGA HERD",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"LUIZ FELIPE BARBOSA SILVA",n:1500,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"FAZENDA MANOANA - KARINE",n:104,t:"B",s:"SIREMATCH",na:1,m:"nov-25"},
{e:"César Oliveira",a:"12",c:"CARLOS ALBERTO RODRIGUES DE OLIVEIRA",cl:"JAIME DE ASSIS MACHADO",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"João Vitor Albach",n:100,t:"KAM",s:"VENDA HERD",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Bulka",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Francisco Prestes",n:200,t:"KAM",s:"VENDA HERD",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Juliano Jarek",n:250,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"LUIS FELIPE BARBOSA SILVA",n:1500,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Junior Souza Carneiro",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Jurandir hofmam",n:195,t:"KAM",s:"SIREMATCH",na:195,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Leticia Iank",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Luan Gomes",n:400,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Lucio Hoffman Krainske",n:60,t:"KAM",s:"SIREMATCH",na:60,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"ITALO JOSE DA SILVA LUZIA",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Edson Kayano/ fazenda Verde Vale",n:300,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mariele Stokler",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"set-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Jose Eustaquio Pereira Amorim",n:379,t:"KAM",s:"SIREMATCH",na:379,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Marius Bronkrorst",n:500,t:"LAGOA+",s:"VISITA TÉCNICA",na:3,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Melkstad",n:3000,t:"KAM",s:"PROSPEC",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Melkstad",n:4000,t:"LAGOA+",s:"VISITA LAGOA+",na:4,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Milena soek Lassing",n:195,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Nelson Morgan",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"RONILDO VIEIRA DE PAULO",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Sebastião Dias de Souza",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GEISON CARNIEL",n:238,t:"LAGOA+",s:"SIREMATCH",na:238,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Paulo Cesar Hoffman Sibiman",n:45,t:"KAM",s:"SIREMATCH",na:45,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VITOR ANDRE CAIXETA",n:170,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Eduardo Linhares Tonon",n:250,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Eduardo Linhares Tonon",n:250,t:"HOME OFFICE",s:"SIREMATCH",na:250,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Paulo Siben",n:45,t:"KAM",s:"SIREMATCH",na:45,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Trentin",n:500,t:"KAM",s:"PROSPEC",na:2,m:"dez-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIS FERNANDO PANIZ",cl:"CARLINHOS MATHEUS WILLERS",n:60,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"VITOR EING MULLER",cl:"FAZENDA ROCKER",n:178,t:"KAM",s:"SIREMATCH",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"VITOR EING MULLER",cl:"FAZENDA EXTERBUSS",n:181,t:"KAM",s:"SIREMATCH",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"VITOR EING MULLER",cl:"FAZENDA DEBIASE",n:85,t:"B",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"VITOR EING MULLER",cl:"FAZENDA CASCO",n:120,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"VITOR EING MULLER",cl:"REUNIAO VICTOR MULLER/MARCELO RICKEN",n:0,t:"C",s:"PROSPEC",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GRANJA RISSO",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"IMERSAO HOLANDES-AREA 18",n:0,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"GUILHERME RODRIGUES",cl:"JOAO NIVALDO DAMASO DA SILVEIRA",n:196,t:"KAM",s:"SIREMATCH",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"FELIPE FLOSS",n:100,t:"LAGOA+",s:"COLETA HERD",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GELSON JOSE DA SILVEIRA",n:100,t:"LAGOA+",s:"COLETA HERD",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GABRIEL COFSEVICZ",n:35,t:"C",s:"COLETA HERD",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GABRIEL COFSEVICZ",n:35,t:"C",s:"SIREMATCH",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DIEGO BORBA MULLER",cl:"ELVIO JOEL COGO",n:266,t:"KAM",s:"SIREMATCH",na:266,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GEISON CARNIEL",n:238,t:"LAGOA+",s:"COLETA HERD",na:2,m:"nov-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"JAN GERRIT BERENDSEN",n:457,t:"LAGOA+",s:"SIREMATCH",na:457,m:"set-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GEISON CARNIEL",n:238,t:"LAGOA+",s:"ENTREGA HERD",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"PREFEITURA DE MODELO/SC",n:0,t:"KAM",s:"VISITA TÉCNICA",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"COOPERATIVA REGIONAL DO EXTREMO OESTE-COOPEROESTE",n:0,t:"FEIRA/EVENTO",s:"VISITA TÉCNICA",na:10,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"PAULINO BARON",n:120,t:"KAM",s:"LAGOA +",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"PAULINO BARON",n:120,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ADEMIR LUDKE",n:300,t:"KAM",s:"LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ADEMIR LUDKE",n:300,t:"KAM",s:"LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CELSO DOS SANTOS GUSTHMANN",n:300,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"APARECIDO PICOLLO",n:45,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CELSO DOS SANTOS GUSTHMANN",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"AGROVETERINARIA ESTANCIA GAUCHA",n:0,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CRISTIANO MANFIOLETI",n:200,t:"LAGOA+",s:"VISITA TÉCNICA",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ELEANDRO CARLOS BATISTTI",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LOIWO DAMMANN",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"LUCAS FERNANDO RUAS",cl:"RAFAEL FRANCISCO ROMANO",n:69,t:"B",s:"VISITA TÉCNICA",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"JULIA MARIA REZENDE GESTEIRA",n:70,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"KARINA BRAZ BERNARDO",n:80,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"EDUARDO FEDATTO",n:90,t:"B",s:"PROSPEC",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ALEX E ANDRE FEDATTO",n:80,t:"B",s:"PROSPEC",na:1,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GIOVANI SMANIOTTO",n:85,t:"B",s:"PROSPEC",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"RENAN SONAGLIO",n:77,t:"B",s:"PROSPEC",na:2,m:"nov-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"FABIO SANTA CATARINA",n:86,t:"B",s:"PROSPEC",na:2,m:"nov-25"},
{e:"Suelen Soares",a:"18",c:"FRANCIANO BLANC ALVES",cl:"NATALICIO, MATEUS E GERVASIO TOILLIER",n:187,t:"KAM",s:"SIREMATCH",na:187,m:"dez-25"},
{e:"Suelen Soares",a:"15",c:"KOURBANY LUIZ CORDEIRO DA CRUZ",cl:"LEANDRO WANDERLIND",n:46,t:"C",s:"SIREMATCH",na:46,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DAVI FORSTHOFER",n:9,t:"CONEXÃO LEITE",s:"SIREMATCH",na:9,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MATEUS ALEXANDRE NORO",n:4,t:"CONEXÃO LEITE",s:"SIREMATCH",na:4,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VANDERLEI BALBINOT",n:24,t:"CONEXÃO LEITE",s:"SIREMATCH",na:24,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ALEXANDRE PERTUSSATI BERTAN",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"SIDIMAR ZANELLA",n:4,t:"CONEXÃO LEITE",s:"SIREMATCH",na:4,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VALCIR BASI",n:42,t:"CONEXÃO LEITE",s:"SIREMATCH",na:42,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GILNEI FERRO",n:34,t:"CONEXÃO LEITE",s:"SIREMATCH",na:34,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JONES BUSNELLO",n:53,t:"CONEXÃO LEITE",s:"SIREMATCH",na:53,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"THAIRA LUIZZY ZANCHETT",n:41,t:"CONEXÃO LEITE",s:"SIREMATCH",na:41,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LEANDRO ROBERTO KLEIN",n:197,t:"CONEXÃO LEITE",s:"SIREMATCH",na:197,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CLEITON WICKER",n:39,t:"CONEXÃO LEITE",s:"SIREMATCH",na:39,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"IVANDRO SANTOS",n:142,t:"CONEXÃO LEITE",s:"SIREMATCH",na:142,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GUSTAVO CASTAGNA",n:24,t:"CONEXÃO LEITE",s:"SIREMATCH",na:24,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DIEGO DALLA VECHIA",n:24,t:"CONEXÃO LEITE",s:"SIREMATCH",na:24,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"SANDRA DAL PUBEL",n:41,t:"CONEXÃO LEITE",s:"SIREMATCH",na:41,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DENI BERTOLLO",n:29,t:"CONEXÃO LEITE",s:"SIREMATCH",na:29,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CLAUDIOMIR SCHETNER",n:23,t:"CONEXÃO LEITE",s:"SIREMATCH",na:23,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ALBINO BECKER",n:18,t:"CONEXÃO LEITE",s:"SIREMATCH",na:18,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ROQUE BONFANTI",n:57,t:"CONEXÃO LEITE",s:"SIREMATCH",na:57,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"AGOSTINHO BAMPI",n:23,t:"CONEXÃO LEITE",s:"SIREMATCH",na:23,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MARCIO LUIZ GIROLOMETTO",n:53,t:"CONEXÃO LEITE",s:"SIREMATCH",na:53,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ELCIO TESTA",n:21,t:"CONEXÃO LEITE",s:"SIREMATCH",na:21,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ANDERSON PIANTA",n:23,t:"CONEXÃO LEITE",s:"SIREMATCH",na:23,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ANTONIO VIEIRO",n:21,t:"CONEXÃO LEITE",s:"SIREMATCH",na:21,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ANDERSON LOVATTO",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DENER EDUARDO MOERS",n:43,t:"CONEXÃO LEITE",s:"SIREMATCH",na:43,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GABRIEL BOGONI SARTORI",n:12,t:"CONEXÃO LEITE",s:"SIREMATCH",na:12,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"HERMES LUCION",n:65,t:"CONEXÃO LEITE",s:"SIREMATCH",na:65,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VANTOIR ANTONIO TONIELLO",n:38,t:"CONEXÃO LEITE",s:"SIREMATCH",na:38,m:"dez-25"},
{e:"Suelen Soares",a:"11",c:"MURILO DE GODOI CANEDO",cl:"RICARDO RODRIGUES BARBOSA",n:274,t:"KAM",s:"SIREMATCH",na:274,m:"dez-25"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"CLEBER DA COSTA PAZ",n:37,t:"C",s:"SIREMATCH",na:37,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ELIZANDRO JUNG",n:72,t:"B",s:"SIREMATCH",na:72,m:"dez-25"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"ADROALDO PERUZZO",n:52,t:"B",s:"SIREMATCH",na:52,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ABEL ROSALEN",n:41,t:"CONEXÃO LEITE",s:"SIREMATCH",na:41,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VALNEI DEL SANT",n:46,t:"CONEXÃO LEITE",s:"SIREMATCH",na:46,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JAIR WAGNER",n:35,t:"CONEXÃO LEITE",s:"SIREMATCH",na:35,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VALDEMAR BESING",n:6,t:"CONEXÃO LEITE",s:"SIREMATCH",na:6,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"INELSE WIEZERMANN BESING",n:12,t:"CONEXÃO LEITE",s:"SIREMATCH",na:12,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"WILLIAN MARCON",n:33,t:"CONEXÃO LEITE",s:"SIREMATCH",na:33,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VALNIR KOCH",n:66,t:"CONEXÃO LEITE",s:"SIREMATCH",na:66,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MAURO LAMB",n:26,t:"CONEXÃO LEITE",s:"SIREMATCH",na:26,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ILDO PUERARI",n:27,t:"CONEXÃO LEITE",s:"SIREMATCH",na:27,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"SCALETE PEGORARO",n:20,t:"CONEXÃO LEITE",s:"SIREMATCH",na:20,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ROSANGELA ANTUNES DE SOUZA PRESTE",n:26,t:"CONEXÃO LEITE",s:"SIREMATCH",na:26,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"TANIA REGINA RODRIGUES DA LUZ",n:17,t:"CONEXÃO LEITE",s:"SIREMATCH",na:17,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"VILMAR DOS ANJOS",n:18,t:"CONEXÃO LEITE",s:"SIREMATCH",na:18,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LEANDRO JOSÉ DE CARVALHO VELOSO",n:19,t:"CONEXÃO LEITE",s:"SIREMATCH",na:19,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CLEITON WATTE",n:44,t:"CONEXÃO LEITE",s:"SIREMATCH",na:44,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"IZAIR LAVRATI",n:54,t:"CONEXÃO LEITE",s:"SIREMATCH",na:54,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ALCIMAR PAULATA",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JOLVANI ALVEZ PINTO",n:36,t:"CONEXÃO LEITE",s:"SIREMATCH",na:36,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"NEURI LUIS DALL AGNOL",n:3,t:"CONEXÃO LEITE",s:"SIREMATCH",na:3,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LAIR PASETTE",n:10,t:"CONEXÃO LEITE",s:"SIREMATCH",na:10,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LUIZ CARLOS DA SILVA",n:12,t:"CONEXÃO LEITE",s:"SIREMATCH",na:12,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GILMAR PRESTES DOS SANTOS",n:10,t:"CONEXÃO LEITE",s:"SIREMATCH",na:10,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MARCELO ANTONIO LINK",n:12,t:"CONEXÃO LEITE",s:"SIREMATCH",na:12,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"CLEOMIR RAFAGNIN",n:34,t:"CONEXÃO LEITE",s:"SIREMATCH",na:34,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ADRIANO KIPPER",n:36,t:"CONEXÃO LEITE",s:"SIREMATCH",na:36,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DIOGO DALZOCHIO",n:10,t:"CONEXÃO LEITE",s:"SIREMATCH",na:10,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"GELSON NARDINO",n:3,t:"CONEXÃO LEITE",s:"SIREMATCH",na:3,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"STEFANI CRISTINA SPECHT",n:30,t:"CONEXÃO LEITE",s:"SIREMATCH",na:30,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ORIDES CORONETT",n:27,t:"CONEXÃO LEITE",s:"SIREMATCH",na:27,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DARLEI KEMPER",n:24,t:"CONEXÃO LEITE",s:"SIREMATCH",na:24,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JEAN FLACK",n:37,t:"CONEXÃO LEITE",s:"SIREMATCH",na:37,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ELENICE DUMKE",n:46,t:"CONEXÃO LEITE",s:"SIREMATCH",na:46,m:"dez-25"},
{e:"Suelen Soares",a:"18",c:"LUIZ FELIPE KRUEL BORGES",cl:"RUDIVAM SOARES",n:25,t:"C",s:"SIREMATCH",na:25,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gelson da Rosa Pedroso",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ELISABETE JUNQUEIRA",n:0,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GUSTAVO LEITE",n:0,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"CLAUDIO ANTONIO RESENDE",n:0,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:343,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Patricia Aparecida de Almeida",n:20,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO DE AVILA",n:60,t:"KAM",s:"ENTREGA HERD",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Welinton Willian Lassing",n:200,t:"LAGOA+",s:"SIREMATCH",na:200,m:"nov-25"},
{e:"Érica Fonseca",a:"12",c:"",cl:"Luiz Marcos Curcio",n:205,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"ALYSSON SENRA SILVA",n:400,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"LUIZ CARLOS BANDOLI GOMES",n:300,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"LEONARDO DE LIMA AVELAR",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"SELECT SIRES DO BRASIL",n:0,t:"KAM",s:"CLARIFIDE GO",na:5,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"FÚLVIO BRENO DE OLIVEIRA LIMA",n:0,t:"KAM",s:"CLARIFIDE GO",na:4,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"MARCELO DE FARIA PAIZANTE",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"HUGO ARBACHE ARANTES",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"JEAN VIC MESABARBA E AGUIAR ARRABAL DE MACEDO VICENTE",n:0,t:"KAM",s:"CLARIFIDE GO",na:3,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"OLAVO DE RESENDE BARROS JÚNIOR",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"CARLOS ALBERTO LUIZ DE ALMEIDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:3,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"CARLOS ALBERTO LUIZ DE ALMEIDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:8,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"ANGELO GONÇALVES DOS SANTOS",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"EUGENIO DELIBERATO FILHO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"JOSÉ ALBERTO PAIFFER MENK",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"MARCOS CORTELETTI",n:0,t:"KAM",s:"CLARIFIDE GO",na:3,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"PAULO GABRIEL REIS NADER",n:0,t:"KAM",s:"CLARIFIDE GO",na:3,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"ALEXANDRE PEREIRA DA COSTA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"ALTA GENETICS DO BRASIL LTDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"CLAUDIO MANOEL MACEDO CERQUEIRA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"JOÃO PEDRO AYRES NEVES DE AZEVEDO",n:0,t:"KAM",s:"CLARIFIDE GO",na:3,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"PAULO CESAR DE CARVALHO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"RONALDO ANTÔNIO ZICA DA COSTA",n:0,t:"KAM",s:"CLARIFIDE GO",na:6,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"SERGIO RODRIGUES NUNES",n:0,t:"KAM",s:"CLARIFIDE GO",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"GILDA MONTEIRO DA GAMA",n:0,t:"KAM",s:"CLARIFIDE GO",na:12,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"Dirceu Rios de Castro Alves",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"dez-25"},
{e:"Érica Fonseca",a:"",c:"",cl:"Jairo Rodrigues de Oliveira",n:0,t:"KAM",s:"CLARIFIDE GO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"HENRIQUE FILHO",n:60,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIO JOSE FRANÇA",n:18,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALMIR ROGERIO BERTUSSE",n:30,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NILDOMAR GUSMAO",n:28,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSE PROCOPIO SOBRINHO",n:140,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCELO VIEIRA NETO",n:25,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSE CARLOS NICHESK",n:26,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CARLOS ANTONIO PROCOPIO",n:80,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUIZ CARLOS MACRON",n:45,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"IVANILDO SEECHIS",n:38,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ELISON RODRIGO SANTANA",n:40,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSÉ DREHER",n:35,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:3,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CELIO RICARDO GOETZ",n:21,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARLI DE LIMA",n:16,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"PEDRO ROCHA",n:90,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIA ROCHA RODRIGUES",n:25,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALDO JULIO DE AQUINO",n:10,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"AILTON CASTRO SILVA",n:15,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARIA APARECIDA FERNANDES",n:26,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EREVALDO AP. CARVALHO",n:65,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:3,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOCIMAR JOSE DE SOUZA",n:21,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUIZ GONCALVES DA SILVA",n:20,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JUSCILENE CAMPOS",n:15,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"IZAC DE CAMPOS MENESES",n:34,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:3,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILMAR MARTINS DE OLIVEIRA",n:36,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"RIQUINEI ANTONIO DA SILVA",n:45,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSUE ELIAS ELLER",n:34,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"RODRIDO PILONETO",n:54,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:3,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILMAR DA SILVA ANDRADE",n:35,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCELO DO NASCIMENTO",n:60,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DEVIDE ALISSON DE FARIA ABREU",n:36,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"VANDERSON DE OLIVEIRA",n:25,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ELAINE PEREIRA DOS SANTOS",n:21,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NELSI BARBOSA",n:35,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ADRIANO PEREIRA DE SOUZA",n:23,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILBERTO JESUS GOMES",n:27,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DARLEI ROCHA CARVALHO",n:21,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EDUARDO PAULO PEREIRA",n:60,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:3,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DOUGLAS ALVES RODRIGUES",n:26,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EDIMAURO SANTOS DE JESUS",n:35,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"Phillippe Monteiro",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"MIGUEL BIESDORF",n:140,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ROGERIO VICENTE BARBOSA",n:0,t:"LAGOA+",s:"SIREMATCH",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ADRIANO RESENDE BARBOSA",n:100,t:"KAM",s:"VENDA HERD",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ADRIANO RESENDE BARBOSA",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"dez-25"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO  DE AVILA CARVALHO",n:60,t:"KAM",s:"SIREMATCH",na:2,m:"dez-25"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUIZ GONZAGA PESSONI",n:170,t:"CONEXÃO LEITE",s:"SIREMATCH",na:170,m:"dez-25"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"LUIZ ANTONIO NARDIM",n:60,t:"C",s:"SIREMATCH",na:120,m:"dez-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"AGROPECUARIA ANTAS LTDA",n:35,t:"C",s:"SIREMATCH",na:35,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Pedro Iank",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Pedro Paulo Tirskowiski",n:257,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Reginaldo Paes Steklain",n:82,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Renato Macedo",n:400,t:"KAM",s:"PROSPEC",na:2,m:"out-25"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JEAN DE PINHO MENDES",n:80,t:"C",s:"SIREMATCH",na:80,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Roberti Leonardi",n:150,t:"KAM",s:"VISITA LAGOA+",na:3,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Roberto Borg",n:2000,t:"KAM",s:"ENTREGA HERD",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Roberto Borg",n:2000,t:"KAM",s:"ENTREGA HERD",na:1,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rodrigo Napoli Prestes",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rogério Borg",n:400,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"set-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rogério Borg",n:500,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rogerio Kremer",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"APARECIDA PASSOS VIANA",n:35,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Rogério Weber",n:50,t:"KAM",s:"SIREMATCH",na:50,m:"nov-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rosana Brino",n:187,t:"KAM",s:"SIREMATCH",na:187,m:"nov-25"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JUDSON MARTINS DE SOUZA",n:0,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Villy Frits kugler",n:200,t:"KAM",s:"SIREMATCH",na:2,m:"out-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Villy Frits kugler",n:200,t:"KAM",s:"SIREMATCH",na:200,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Marcio Brino",n:181,t:"KAM",s:"SIREMATCH",na:181,m:"dez-25"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ROBERTO MEINDERT BORG",n:1672,t:"KAM",s:"ATUALIZAÇÃO HERD",na:152,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LEANDRO GRAFF",cl:"MILTON JAIR ANDREATTA",n:186,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:45,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"MARCOS STEKLAIN",n:295,t:"KAM",s:"ATUALIZAÇÃO HERD",na:18,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LEANDRO GRAFF",cl:"DANIEL BREUNIG",n:284,t:"KAM",s:"ATUALIZAÇÃO HERD",na:79,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"DANIEL CICHELERO",n:611,t:"KAM",s:"ATUALIZAÇÃO HERD",na:15,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"ROBERTO HANEL",n:35,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"WALDEMAR GRAMMS",n:77,t:"B",s:"ATUALIZAÇÃO HERD",na:19,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"ANDERSON SIPP",n:51,t:"B",s:"ATUALIZAÇÃO HERD",na:17,m:"jan-26"},
{e:"Suelen Soares",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"CARLOS VIEIRA ROSA",n:128,t:"KAM",s:"ATUALIZAÇÃO HERD",na:9,m:"jan-26"},
{e:"Suelen Soares",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"ERNANDO DA SILVA PEREIRA",n:117,t:"KAM",s:"ATUALIZAÇÃO HERD",na:34,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"IVONEL KARMAZIM",n:126,t:"KAM",s:"ATUALIZAÇÃO HERD",na:9,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"HENRIQUE SCHMIDT STEKLAIN",n:167,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:30,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ERNANI BLASI",n:45,t:"KAM",s:"ATUALIZAÇÃO HERD",na:16,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CRISTINE FINKLER DREYER",n:97,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:4,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"WELIGSON WELTER",n:27,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CELSO LEOMAR KRUG",n:144,t:"KAM",s:"ATUALIZAÇÃO HERD",na:7,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CLEO DE BORTOLI",n:54,t:"KAM",s:"ATUALIZAÇÃO HERD",na:8,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"MAURO CHEMIN",n:329,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:37,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"VALDENI BATISTI",n:136,t:"KAM",s:"ATUALIZAÇÃO HERD",na:23,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JAQUELINE DOS SANTOS",n:74,t:"KAM",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JOÃO CARLOS PORT",n:92,t:"KAM",s:"ATUALIZAÇÃO HERD",na:12,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JOSÉ LIBRELOTTO",n:294,t:"KAM",s:"ATUALIZAÇÃO HERD",na:22,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LEANDRO GRAFF",cl:"ELISEU JOSE CARRE",n:224,t:"KAM",s:"ATUALIZAÇÃO HERD",na:56,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"JOARI ANTONIO PALAVESINI",n:354,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:50,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"SONIA RASPOLT",n:148,t:"B",s:"ATUALIZAÇÃO HERD",na:30,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"ANTONIO MACARI",n:128,t:"B",s:"ATUALIZAÇÃO HERD",na:29,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"Artemio steimam",n:143,t:"B",s:"ATUALIZAÇÃO HERD",na:38,m:"jan-26"},
{e:"Suelen Soares",a:"12",c:"HUGO LEONARDO LOURENCO DOS REIS",cl:"GLAUTER RODRIGUES GOULART",n:476,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:100,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ALISSON TOMAZI",n:31,t:"B",s:"ATUALIZAÇÃO HERD",na:31,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"GUILHERME AMMAN",n:33,t:"B",s:"ATUALIZAÇÃO HERD",na:3,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"ROBERTO LUIZ PETRY",n:152,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:56,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"SAMUEL LUIS MANSKE",n:60,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:60,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"MARCOS SOUZA FREITAS",n:10,t:"B",s:"ATUALIZAÇÃO HERD",na:10,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"TIAGO RAFAEL ROCKENBACH",n:30,t:"B",s:"ATUALIZAÇÃO HERD",na:7,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"JACSON WILLIAN BORSTMANN SCHMITT",n:150,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:40,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"VANIR KNAPP",n:99,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:50,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"ALEX BRANDALISE",cl:"ALEX BRANDALISE",n:126,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:20,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"MARIUS CORNELIUS BRONKHORST",n:1511,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:53,m:"jan-26"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"CARLOS ALEXANDRE DE FIGUEIREDO",n:122,t:"KAM",s:"ATUALIZAÇÃO HERD",na:19,m:"jan-26"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"DANIEL JOSE JUNIOR FERREIRA",n:41,t:"B",s:"ATUALIZAÇÃO HERD",na:41,m:"jan-26"},
{e:"Suelen Soares",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GERALDO MARCIO DE AVILA CARVALHO",n:109,t:"KAM",s:"ATUALIZAÇÃO HERD",na:19,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ALESSANDRA BARTH",n:21,t:"B",s:"ATUALIZAÇÃO HERD",na:21,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"DOUWE SIBMA",n:789,t:"KAM",s:"ATUALIZAÇÃO HERD",na:89,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"RENAN KONIG",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"MARCOS HOLZ",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LUIS ANTONIO ROSSINI JUNIOR",n:6,t:"B",s:"ATUALIZAÇÃO HERD",na:6,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EMANUEL CARINI",n:6,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LEONARDO AZEVEDO ELOY",n:89,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:22,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"SIDIMAR POOTER",n:15,t:"B",s:"ATUALIZAÇÃO HERD",na:15,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"RICARDO BACKES",n:78,t:"B",s:"ATUALIZAÇÃO HERD",na:12,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ANA CLAUDIA AMARAL ALMEIDA",n:88,t:"B",s:"ATUALIZAÇÃO HERD",na:26,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"MIRTES ESCALA RAMOS LEITE",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LUCINEIA KUSTER",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EZEQUIEL GUILHERME FIORESE",n:98,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:22,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JOSI CARLA ELLWANGER",n:33,t:"KAM",s:"ATUALIZAÇÃO HERD",na:8,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EDGAR KLAN",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CRISTINE FINKLER DREYER",n:97,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:7,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"ROGERIO WEBER",n:45,t:"KAM",s:"ATUALIZAÇÃO HERD",na:25,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"JOÃO VICTOR ALBACH",n:23,t:"KAM",s:"ATUALIZAÇÃO HERD",na:23,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"Welinton Willian Lassing",n:50,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:50,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"ADEMERCIO SHAPARINI",n:130,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:53,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"ROBERTO VALDINEI DAY",n:12,t:"C",s:"SIREMATCH",na:12,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"TIAGO RAFAEL ROCKENBACH",n:30,t:"C",s:"SIREMATCH",na:30,m:"jan-26"},
{e:"Suelen Soares",a:"12",c:"HUGO LEONARDO LOURENCO DOS REIS",cl:"GLAUTER RODRIGUES GOULART",n:476,t:"KAM",s:"SIREMATCH",na:476,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"HUGO ZARDO FILHO",cl:"DANIEL CICHELERO",n:611,t:"KAM",s:"SIREMATCH",na:611,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"RAFAELA BONATO KROMBAUER",n:46,t:"C",s:"SIREMATCH",na:46,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"KOURBANY LUIZ CORDEIRO DA CRUZ",cl:"EDUARDO WARLING",n:38,t:"C",s:"SIREMATCH",na:38,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ALTAIR LUIZ PASQUALOTTO",n:68,t:"B",s:"SIREMATCH",na:68,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LEANDRO GRAFF",cl:"RENATO ERNO GUSE",n:240,t:"KAM",s:"SIREMATCH",na:240,m:"jan-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"IGOR STEKLAIN",n:295,t:"KAM",s:"SIREMATCH",na:295,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Claudio Aparecido de Souza",n:50,t:"KAM",s:"SIREMATCH",na:50,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Arildo Steklain",n:90,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Reginaldo Steklain",n:80,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"JOSE ERNAILTON DE CARVALHO",n:45,t:"B",s:"SIREMATCH",na:45,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Adriano Wacherski",n:100,t:"KAM",s:"SIREMATCH",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"kamilo Miguel Bart",n:300,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Afonso/ Fazenda São Rafael",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Genson Anhaia",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Edson Mendes",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Cristiane de Fatima Lodovirge",n:50,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Coaflep",n:500,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCELO DO NASCIMENTO",n:80,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"dez-25"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Nelson Scholse",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan Petter",n:450,t:"LAGOA+",s:"VISITA LAGOA+",na:3,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elisabeth Erthal",n:150,t:"LAGOA+",s:"SIREMATCH",na:150,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Lucio Hoffman Krainske",n:40,t:"KAM",s:"SIREMATCH",na:40,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Reginaldo Steklain",n:80,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Willy Frits Kugler",n:130,t:"KAM",s:"SIREMATCH",na:130,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Francisco Canha",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Luis Fernando de Brito",n:80,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Juliano Jarek",n:200,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bruno Oles Staron",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Leocadia Oberek",n:120,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Emerson Jose Ribeiro",n:90,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mateus Felipe Ostapoviski",n:120,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"JEAN MICHEL ROTAVA",cl:"Sonia Raspolt",n:85,t:"KAM",s:"ENTREGA HERD",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"JEAN MICHEL ROTAVA",cl:"Artemio steimam",n:125,t:"KAM",s:"ENTREGA HERD",na:3,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"JEAN MICHEL ROTAVA",cl:"ANTONIO MACARI",n:80,t:"KAM",s:"ENTREGA HERD",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Neverson Schanne",n:69,t:"B",s:"SIREMATCH",na:69,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JULIANA PAINI",n:57,t:"B",s:"SIREMATCH",na:57,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Luiz Drachesk",n:70,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Giovani Corso",n:110,t:"KAM",s:"VENDA HERD",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Ronivan Restelatto",n:85,t:"B",s:"VENDA HERD",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Evandro Buzanelli",n:140,t:"KAM",s:"VENDA HERD",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Marcos Rossetto",n:97,t:"KAM",s:"VENDA HERD",na:1,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Emilio Schareatner",n:120,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"JOSE FICHINA",n:130,t:"CONEXÃO LEITE",s:"SIREMATCH",na:130,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"EDUARDA CAGNONI",n:80,t:"CONEXÃO LEITE",s:"SIREMATCH",na:80,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"EVERTON FERRUGEM NASCIMENTO SÃO JULIÃO",n:120,t:"CONEXÃO LEITE",s:"SIREMATCH",na:120,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"MARCOS TONIN",n:55,t:"CONEXÃO LEITE",s:"SIREMATCH",na:55,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"PEDRO HENRIQUE CAMPOLONGO",n:70,t:"CONEXÃO LEITE",s:"SIREMATCH",na:70,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"MARCIO COLTO RIBEIRO",n:60,t:"CONEXÃO LEITE",s:"SIREMATCH",na:60,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GERALDO ALVARENGA",n:80,t:"CONEXÃO LEITE",s:"SIREMATCH",na:80,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"HUMBERTO LATARO",n:130,t:"CONEXÃO LEITE",s:"SIREMATCH",na:130,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"JOAO LATARO",n:80,t:"CONEXÃO LEITE",s:"SIREMATCH",na:80,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUIZ PESSONI",n:200,t:"CONEXÃO LEITE",s:"SIREMATCH",na:200,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUCIA CARVALHO COUTO ROSA",n:130,t:"CONEXÃO LEITE",s:"SIREMATCH",na:130,m:"jan-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Jayme Reginaldo Francisco",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"AGROPECUARIA MALLMANN LTDA",n:300,t:"LAGOA+",s:"VISITA LAGOA+",na:5,m:"jan-26"},
{e:"César Oliveira",a:"20",c:"LUIZ HARLITON CAVALCANTE MONTEIRO MOTA",cl:"ANTONIO FRANCISCO CARNEIRO",n:80,t:"C",s:"SIREMATCH",na:80,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"DEBORA RISSATO CUNHA PRIOR",n:80,t:"C",s:"PROSPEC",na:1,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GERALDO ALVARENGA",n:90,t:"C",s:"SIREMATCH",na:90,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"LUIS HAMILTON BRUXELAS DE FREITAS",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"CELSO GIUBILEI DE OLIVEIRA",n:50,t:"C",s:"SIREMATCH",na:50,m:"jan-26"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"JOAO MARCIO MARTINS",n:0,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"jan-26"},
{e:"César Oliveira",a:"13",c:"RENATA KFOURI FORERO",cl:"LUIS FERNANDO DOS SANTOS",n:45,t:"C",s:"SIREMATCH",na:45,m:"jan-26"},
{e:"Érica Fonseca",a:"11",c:"JOAO MACHADO PRATA NETO",cl:"PECPLAN ABS IMPORTAÇÃO E EXPORTAÇÃO LTDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"",c:"",cl:"SEXING TECH DO BRASIL COM C T M G A LTDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"VALÉRIO MACHADO GUIMARÃES",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"VITOR LEITE PEREIRA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"14",c:"JOSE CLAUDIO BARBOSA",cl:"FÚLVIO BRENO DE OLIVEIRA LIMA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"14",c:"FERNANDO JOSE DINIZ FIGUEIREDO",cl:"TAYRONNE CAMPOS VIEIRA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"LUIZ FERNANDO REIS",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"14",c:"ALESSANDRO MAGNO CAMBRAIA ESTEVES",cl:"WALTER VITOR DE OLIVEIRA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS EDUARDO BUENO MAGANO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"13",c:"RENATA KFOURI FORERO",cl:"JOSÉ RONALDO LOPES",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"11",c:"MURILO DE GODOI CANEDO",cl:"BRUNO CHAIBUD DE ARAUJO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"",c:"",cl:"JOSÉ CARLOS DA MATA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"14",c:"JOSE CLAUDIO BARBOSA",cl:"ORLEANS CLEY VIEIRA NASCIMENTO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS EDUARDO DURCERCINO DA SILVA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"13",c:"VINICIUS GABRIEL MENDES GUSMAO",cl:"GENETICA ADITIVA AGROPECUARIA LTDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"FELIPE TAVARES",cl:"LUIZ DIONE BARBOSA DE MELO",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"ALAOR JOSE MACHADO",n:200,t:"KAM",s:"SIREMATCH",na:77,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"RONALDO ANTÔNIO ZICA DA COSTA",n:50,t:"C",s:"VISITA TÉCNICA",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Valerio",n:70,t:"B",s:"PROSPEC",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"REUNIÃO ALINHAMENTO ÁREA 12",n:0,t:"",s:"",na:0,m:""},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"WILLIAM JOSE CAIXETA",n:300,t:"LAGOA+",s:"PROSPEC LAGOA +",na:2,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"MARCONI RIBEIRO DE BARROS",n:130,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"jan-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"RUBENS CAIXETA",n:120,t:"KAM",s:"PROSPEC",na:2,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"MELKSTAD",n:2500,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Adriano renato Kiers",n:1600,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"jan-26"},
{e:"Felipe Prestes",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"MELKSTAD",n:2500,t:"LAGOA+",s:"VISITA LAGOA+",na:1,m:"jan-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"RENAN KONIG",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"MARCOS HOLZ",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LUIS ANTONIO ROSSINI JUNIOR",n:6,t:"B",s:"ATUALIZAÇÃO HERD",na:6,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EMANUEL CARINI",n:6,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LEONARDO AZEVEDO ELOY",n:89,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:22,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"SIDIMAR POOTER",n:15,t:"B",s:"ATUALIZAÇÃO HERD",na:15,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"RICARDO BACKES",n:78,t:"KAM",s:"ATUALIZAÇÃO HERD",na:12,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"ANA CLAUDIA AMARAL ALMEIDA",n:88,t:"KAM",s:"ATUALIZAÇÃO HERD",na:26,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"MIRTES ESCALA RAMOS LEITE",n:5,t:"B",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"LUCINEIA KUSTER",n:5,t:"C",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EZEQUIEL GUILHERME FIORESE",n:98,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:22,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"JOSI CARLA ELLWANGER",n:33,t:"B",s:"ATUALIZAÇÃO HERD",na:8,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"EDGAR KLAN",n:5,t:"C",s:"ATUALIZAÇÃO HERD",na:5,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"CRISTINE FINKLER DREYER",n:97,t:"KAM",s:"ATUALIZAÇÃO HERD",na:7,m:"fev-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"ROGERIO WEBER",n:45,t:"B",s:"ATUALIZAÇÃO HERD",na:25,m:"fev-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"JOÃO VICTOR ALBACH",n:23,t:"KAM",s:"ATUALIZAÇÃO HERD",na:23,m:"fev-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"WELINTON WILLIAN LASIG",n:50,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:50,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"ADEMERCIO SHAPARINI",n:130,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:53,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"FREDERICO CASSANTA",cl:"BEATRIZ LERIN",n:20,t:"B",s:"ATUALIZAÇÃO HERD",na:20,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"QUERLINDE ERPEN",n:40,t:"B",s:"ATUALIZAÇÃO HERD",na:10,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUCAS FERNANDO RUAS",cl:"DARCI TREVISAN",n:18,t:"C",s:"SIREMATCH",na:18,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"NEVERSON SCHANNE",n:71,t:"B",s:"SIREMATCH",na:71,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"ROSELIO BINSFELD",n:120,t:"KAM",s:"SIREMATCH",na:120,m:"fev-26"},
{e:"Suelen Soares",a:"12",c:"LEONARDO MAIA",cl:"MARCOS DUARTE LOPES",n:112,t:"KAM",s:"SIREMATCH",na:112,m:"fev-26"},
{e:"Suelen Soares",a:"11",c:"FAZENDA",cl:"JOAO ROBERTO MIGLIARI LEMBI",n:707,t:"KAM",s:"SIREMATCH",na:707,m:"fev-26"},
{e:"Suelen Soares",a:"12",c:"LEONARDO MAIA",cl:"CARLOS FABIO NOGUEIRA RIVELLI",n:489,t:"KAM",s:"SIREMATCH",na:489,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"RUBEN BRINGMANN",n:52,t:"B",s:"SIREMATCH",na:52,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"RAFAEL LINCK",n:46,t:"C",s:"SIREMATCH",na:46,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"RICARDO MOREIRA",cl:"FELIPE JUNIOR CANTELE",n:73,t:"B",s:"SIREMATCH",na:73,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JULIANA PAINI",n:31,t:"C",s:"SIREMATCH",na:31,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JULIANE MANTOVANI DA ROSA",n:48,t:"C",s:"SIREMATCH",na:48,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"DALVAN GIRARDI",n:236,t:"KAM",s:"SIREMATCH",na:236,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LUIZ CARLOS GOMES",n:43,t:"C",s:"SIREMATCH",na:43,m:"fev-26"},
{e:"Suelen Soares",a:"15",c:"JEAN MICHEL ROTAVA",cl:"JAIR GHIZONI NECKER",n:78,t:"B",s:"SIREMATCH",na:78,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"SERGIO JOSE ARNET",n:150,t:"KAM",s:"SIREMATCH",na:150,m:"fev-26"},
{e:"Suelen Soares",a:"15",c:"ADAO MARCOS MACHADO",cl:"WALDIR JUNQUERA DE ANDRADE",n:951,t:"KAM",s:"SIREMATCH",na:951,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"LUIS FERNANDO PANIZ",cl:"DERLI BRINGMANN",n:47,t:"C",s:"SIREMATCH",na:47,m:"fev-26"},
{e:"Suelen Soares",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"ANDERSON PROVIN ZENATTI",n:125,t:"KAM",s:"SIREMATCH",na:125,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Ronaldo - Faz. Marques",n:200,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Agro Faria Matos",n:250,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"JOSÉ ANTONIO CARDOSO",n:150,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Rodrigo - Faz. Guimaranea",n:300,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Nilso - Faz. Guimaranea",n:300,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Zé da Julia",n:400,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Luiz - Fazenda Serra Negra",n:600,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda WP - Pablo",n:200,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Celso Lucio",n:300,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Santa Cecilia - Valdomiro",n:100,t:"C",s:"PROSPEC",na:2,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Recanto dos Tucanos - Rodrigo",n:250,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Marcio Santos Batista - Faz. São Gabriel",n:100,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Campo Bonito - Armelindo",n:100,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Philaladelphia",n:120,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Olhos D'agua - Renato",n:400,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Francisco - Zoom",n:100,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Edgar Moreira",n:1000,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Antonio Antunes",n:200,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Carlos Antunes",n:500,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Fortaleza",n:200,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Gustavo",n:140,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Serrote",n:300,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Flavio - Fazenda Juá",n:700,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"TANIO ELIEZER ALVES",n:300,t:"LAGOA+",s:"SIREMATCH",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Burracão - José Paulo",n:1000,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Rodrigo",n:300,t:"B",s:"PROSPEC",na:2,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Bananal - Sergio",n:300,t:"B",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"11",c:"RICARDO BONATO",cl:"José Raimundo",n:200,t:"LAGOA+",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"11",c:"RICARDO BONATO",cl:"Wladir Biangulo",n:300,t:"B",s:"SIREMATCH",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"11",c:"RICARDO BONATO",cl:"ANTONIO GERALDO DE MOURA",n:100,t:"B",s:"COLETA HERD",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"11",c:"RICARDO BONATO",cl:"ALAIR BELCHIOR DE SIQUEIRA",n:120,t:"C",s:"PROSPEC LAGOA +",na:2,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"GENEX GENETICA BRASIL LTDA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"JOSÉ CARLOS DA MATA",n:0,t:"KAM",s:"CLARIFIDE GO",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"Luiz Marcos Curcio",n:200,t:"LAGOA+",s:"VISITA LAGOA+",na:3,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"Vinícius Lúcio de Sousa",n:30,t:"C",s:"SIREMATCH",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"Geraldo Prudente de Oliveira",n:86,t:"C",s:"SIREMATCH",na:1,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"WLADIMIR LEON CARVALHO COLODETTI",cl:"João Gonçalves Baeta Junior",n:60,t:"C",s:"PROSPEC",na:2,m:"fev-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"Sérgio Rodrigues Nunes",n:0,t:"B",s:"CLARIFIDE GO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"RODRIGO ANTONIO CEZAR DE LIMA",cl:"MARICELMA RUIZ",n:100,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"RODRIGO ANTONIO CEZAR DE LIMA",cl:"DOUGLAS SANDRINE",n:110,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"RODRIGO ANTONIO CEZAR DE LIMA",cl:"JOSE NELSON CAMELOTE",n:180,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"RODRIGO ANTONIO CEZAR DE LIMA",cl:"FABIO PECHOTO",n:120,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"LUIZ PAULO /ALIOMAR",n:230,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"LUIS DUTRA",n:130,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"KLIESMANN GARCEZ PIMENTA",n:40,t:"B",s:"SIREMATCH",na:40,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"ADRIANO ZANI",n:80,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"FABIANA CAMPOS MARIA",n:30,t:"B",s:"SIREMATCH",na:30,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOAO BATISTA JUNIOR",n:55,t:"B",s:"SIREMATCH",na:55,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOAO BATISTA ABRANTES PORTO SIEBE",n:15,t:"B",s:"SIREMATCH",na:15,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"VANDERSON DELMON DO SANTOS",n:25,t:"B",s:"SIREMATCH",na:25,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NILDOMAR GUSMAO",n:42,t:"B",s:"SIREMATCH",na:42,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"FERNANDO NASCIMENTO",n:34,t:"B",s:"SIREMATCH",na:34,m:"fev-26"},
{e:"César Oliveira",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"EDIANE KUHN",n:70,t:"C",s:"SIREMATCH",na:70,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"FABIO DE CAMARGO PACHECO",cl:"EDUARDA CAGNONI DOS SANTOS",n:33,t:"CONEXÃO LEITE",s:"SIREMATCH",na:33,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"EVERTON NASCIMENTO SAO JULIAO",n:82,t:"CONEXÃO LEITE",s:"SIREMATCH",na:82,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"HUMBERTO PIMENTA LATARO",n:90,t:"CONEXÃO LEITE",s:"SIREMATCH",na:90,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"JOAO BATISTA LATARO",n:20,t:"CONEXÃO LEITE",s:"SIREMATCH",na:20,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"MARCIO RIBEIRO COUTO ROSA",n:40,t:"CONEXÃO LEITE",s:"SIREMATCH",na:40,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"JOSE FICHINA",n:79,t:"CONEXÃO LEITE",s:"SIREMATCH",na:79,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"LUCIANA CARVALHO COUTO ROSA",n:87,t:"CONEXÃO LEITE",s:"SIREMATCH",na:87,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"MARCOS TONIN",n:50,t:"CONEXÃO LEITE",s:"SIREMATCH",na:50,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"LUIZ GONZAGA PESSONI",n:90,t:"CONEXÃO LEITE",s:"SIREMATCH",na:90,m:"fev-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"PEDRO HENRIQUE CAMPOLONGO",n:49,t:"CONEXÃO LEITE",s:"SIREMATCH",na:49,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Luiz Fernando de Brito",n:80,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Claudio Aparecido de Souza",n:50,t:"KAM",s:"SIREMATCH",na:50,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Pedro Iank",n:190,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Eloy ribeiro",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Renato Macedo",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Alexssandro Rebonato",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Francisco Canha/Chiquinho",n:260,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:296,t:"KAM",s:"COLETA HERD",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Leandro Schimidt Steklain",n:150,t:"LAGOA+",s:"ENTREGA HERD",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Welinton Willian Lassing",n:150,t:"LAGOA+",s:"ENTREGA HERD",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elisabeth Erthal",n:150,t:"LAGOA+",s:"SIREMATCH",na:150,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Leandro Schimidt Steklain",n:167,t:"LAGOA+",s:"HOME OFFICE",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Edson Mendes",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Jayme Reginaldo Francisco",n:70,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"ADOLF HENDRIK VAN ARRAGON",n:400,t:"LAGOA+",s:"COLETA HERD",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Tonon",n:350,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:250,t:"LAGOA+",s:"SIREMATCH",na:250,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Luis Carlos Souza",n:70,t:"C",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Valdeci Alves Ferreira",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Valdirene T Ferreira",n:50,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Cesar Closterman",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Joao Abach",n:100,t:"KAM",s:"ENTREGA HERD",na:2,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Igor Steklain",n:296,t:"LAGOA+",s:"COLETA HERD",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Anselmo Siben",n:107,t:"KAM",s:"SIREMATCH",na:107,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Welinton Willian Lassing",n:150,t:"LAGOA+",s:"HOME OFFICE",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Willy Frits Kugler",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Tonon",n:350,t:"LAGOA+",s:"SIREMATCH",na:350,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Alisson Lara",n:200,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Luan Gomes",n:500,t:"KAM",s:"PROSPEC",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Antonio Cardoso",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Amir Castanho",n:120,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bert Loman",n:50,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Dieter Weivert",n:150,t:"KAM",s:"SIREMATCH",na:150,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Edson Mendes",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Diosmar Barros",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"fev-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Adilson Ostapoviski",n:90,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"JULIANA PAINI",n:113,t:"B",s:"SIREMATCH",na:71,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Felipe Floss",n:100,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"LUCAS FERNANDO RUAS",cl:"LUIZ CARLOS GOMES",n:43,t:"KAM",s:"SIREMATCH",na:43,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"LUIS FERNANDO PANIZ",cl:"SERGIO JOSE ARNET",n:150,t:"KAM",s:"SIREMATCH",na:150,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"LUIS FERNANDO PANIZ",cl:"RUBEN BRINGMAN",n:56,t:"B",s:"SIREMATCH",na:52,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"LUAN DAMAN / Ediane kuhn me",n:170,t:"LAGOA+",s:"VISITA LAGOA+",na:2,m:"fev-26"},
{e:"Felipe Prestes",a:"18",c:"FABIO LUIZ CORREA RAPHAEL",cl:"JOSE MARIA REIS JUNIOR / COAMO",n:430,t:"KAM",s:"SIREMATCH",na:120,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"12",c:"FABIO DE CAMARGO PACHECO",cl:"GONCALVES SALLES S/A IND COM (AVIACAO)",n:0,t:"CONEXÃO LEITE",s:"INDICAÇÃO TOURO",na:1,m:"fev-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CELIO RICARDO GOETZ",n:51,t:"CONEXÃO LEITE",s:"SIREMATCH",na:51,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARLI DE LIMA",n:13,t:"CONEXÃO LEITE",s:"SIREMATCH",na:13,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"PEDRO ROCHA",n:58,t:"CONEXÃO LEITE",s:"SIREMATCH",na:58,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIA ROCHA RODRIGUES",n:14,t:"CONEXÃO LEITE",s:"SIREMATCH",na:14,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALDO JULIO DE AQUINO",n:17,t:"CONEXÃO LEITE",s:"SIREMATCH",na:17,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"AILTON CASTRO SILVA",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARIA APARECIDA FERNANDES",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILCEMAR BRAMBILLA",n:39,t:"CONEXÃO LEITE",s:"SIREMATCH",na:39,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"FABIO OLIVEIRA VIEIRA",n:56,t:"CONEXÃO LEITE",s:"SIREMATCH",na:56,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DELSON GARSSETE",n:41,t:"CONEXÃO LEITE",s:"SIREMATCH",na:41,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"FABIANA CAMPOS MARIA",n:26,t:"CONEXÃO LEITE",s:"SIREMATCH",na:26,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOAO BATISTA PEREIRA DA SILVA JUNIOR",n:31,t:"CONEXÃO LEITE",s:"SIREMATCH",na:31,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOAO BATISTA ABRANTES PORTO SIEBE",n:14,t:"CONEXÃO LEITE",s:"SIREMATCH",na:14,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NICOLE PEREIRA PINTO",n:17,t:"CONEXÃO LEITE",s:"SIREMATCH",na:17,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NILDOMAR GUSMÃO",n:29,t:"CONEXÃO LEITE",s:"SIREMATCH",na:29,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EREVALDO AP. CARVALHO",n:76,t:"CONEXÃO LEITE",s:"SIREMATCH",na:76,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOCIMAR JOSE DE SOUZA",n:32,t:"CONEXÃO LEITE",s:"SIREMATCH",na:32,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"VANDERSON DELMON DO SANTOS",n:17,t:"CONEXÃO LEITE",s:"SIREMATCH",na:17,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"Jair Roberto Schefffer",n:124,t:"CONEXÃO LEITE",s:"SIREMATCH",na:124,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JUSCILENE CAMPOS",n:10,t:"CONEXÃO LEITE",s:"SIREMATCH",na:10,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCIO JOSE FRANCA",n:22,t:"CONEXÃO LEITE",s:"SIREMATCH",na:22,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"RIQUINEI ANTONIO DA SILVA",n:34,t:"CONEXÃO LEITE",s:"SIREMATCH",na:34,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILMAR MARTINS DE OLIVEIRA",n:14,t:"CONEXÃO LEITE",s:"SIREMATCH",na:14,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"IZAC DE CAMPOS MENESES",n:39,t:"CONEXÃO LEITE",s:"SIREMATCH",na:39,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ADAILTO MATOS DE OLIVEIRA",n:30,t:"CONEXÃO LEITE",s:"SIREMATCH",na:30,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSE PROCOPIO SOBRINHO",n:95,t:"CONEXÃO LEITE",s:"SIREMATCH",na:95,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSUE ELIAS ELLER",n:25,t:"CONEXÃO LEITE",s:"SIREMATCH",na:25,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"PAULO LOPES VIANA",n:15,t:"CONEXÃO LEITE",s:"SIREMATCH",na:15,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ANGELICA PATRICIA DE LIMA REIS",n:13,t:"CONEXÃO LEITE",s:"SIREMATCH",na:13,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ISAIAS DO NASCIMENTO",n:17,t:"CONEXÃO LEITE",s:"SIREMATCH",na:17,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ADENILSON ALVES DA SILVA",n:34,t:"CONEXÃO LEITE",s:"SIREMATCH",na:34,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CARLOS ANTONIO PROCOPIO",n:88,t:"CONEXÃO LEITE",s:"SIREMATCH",na:88,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"RODRIGO PILONETO",n:48,t:"CONEXÃO LEITE",s:"SIREMATCH",na:48,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUCAS GABRIEL CERCHE",n:23,t:"CONEXÃO LEITE",s:"SIREMATCH",na:23,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ANDERSON COSTA SANTOS",n:22,t:"CONEXÃO LEITE",s:"SIREMATCH",na:22,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ADEMILSON BORGES ROSA",n:43,t:"CONEXÃO LEITE",s:"SIREMATCH",na:43,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CLEOCI NUNES",n:41,t:"CONEXÃO LEITE",s:"SIREMATCH",na:41,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ELISON RODRIGO DOS SANTANA",n:30,t:"CONEXÃO LEITE",s:"SIREMATCH",na:30,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EDUARDO PAULO PEREIRA",n:61,t:"CONEXÃO LEITE",s:"SIREMATCH",na:61,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DOUGLAS ALVES RODRIGUES",n:29,t:"CONEXÃO LEITE",s:"SIREMATCH",na:29,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EDIMAURO SANTOS DE JESUS",n:20,t:"CONEXÃO LEITE",s:"SIREMATCH",na:20,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILMAR DA SILVA ANDRADE",n:34,t:"CONEXÃO LEITE",s:"SIREMATCH",na:34,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARAGANO HUBNER DE FREITAS",n:39,t:"CONEXÃO LEITE",s:"SIREMATCH",na:39,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"MARCELO DO NASCIMENTO",n:55,t:"CONEXÃO LEITE",s:"SIREMATCH",na:55,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ETELVINO MACEDO DO SANTOS",n:22,t:"CONEXÃO LEITE",s:"SIREMATCH",na:22,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DEVIDE ALISSON DE FARIA ABREU",n:29,t:"CONEXÃO LEITE",s:"SIREMATCH",na:29,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"EDVALDO SOUZA QUEIROZ",n:23,t:"CONEXÃO LEITE",s:"SIREMATCH",na:23,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"LUIZ CARLOS MARLON DALSASSO",n:33,t:"CONEXÃO LEITE",s:"SIREMATCH",na:33,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ALMIR ROGERIO BERTUSSE",n:31,t:"CONEXÃO LEITE",s:"SIREMATCH",na:31,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ELAINE PEREIRA DOS SANTOS",n:35,t:"CONEXÃO LEITE",s:"SIREMATCH",na:35,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"NELSI BARBOSA",n:31,t:"CONEXÃO LEITE",s:"SIREMATCH",na:31,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"ADRIANO PEREIRA DE SOUZA",n:12,t:"CONEXÃO LEITE",s:"SIREMATCH",na:12,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"GILBERTO JESUS GOMES",n:16,t:"CONEXÃO LEITE",s:"SIREMATCH",na:16,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"DARLEI ROCHA CARVALHO",n:20,t:"CONEXÃO LEITE",s:"SIREMATCH",na:20,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"VANDERSON DE OLIVEIRA",n:13,t:"CONEXÃO LEITE",s:"SIREMATCH",na:13,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOAO CARLOS",n:32,t:"CONEXÃO LEITE",s:"SIREMATCH",na:32,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CREIMAR SILVEIRA",n:32,t:"CONEXÃO LEITE",s:"SIREMATCH",na:32,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"JOSÉ DREHER",n:28,t:"CONEXÃO LEITE",s:"SIREMATCH",na:28,m:"mar-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CASTERLEITE",n:0,t:"CONEXÃO LEITE",s:"CURSO I.A.",na:7,m:"mar-26"},
{e:"César Oliveira",a:"11",c:"FABIO DE CAMARGO PACHECO",cl:"KLIESMANN GARCEZ PIMENTA LATARO",n:40,t:"C",s:"SIREMATCH",na:40,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Treinamento equipe BrasLeite",n:0,t:"",s:"",na:3,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Treinamento Pratico equipe BrasLeite",n:0,t:"",s:"",na:3,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"João Demetrio Jorge",n:200,t:"",s:"",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"JOAO DIOGO INES NETO",cl:"Joaquim Anibal Carvalho Andrade",n:182,t:"B",s:"SIREMATCH",na:182,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"VITOR CESAR DE MOURA JUNIOR",cl:"BENONI JOSE DE LIMA",n:242,t:"HOME OFFICE",s:"SIREMATCH",na:242,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"LUCAS GONCALVES E SILVA FERREIRA",cl:"Ernando Pereira",n:117,t:"HOME OFFICE",s:"SIREMATCH",na:117,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"SELECT SIRE",n:0,t:"HOME OFFICE",s:"CLARIFIDE GO",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS EDUARDO DURCERCINO DA SILVA",n:500,t:"HOME OFFICE",s:"CLARIFIDE GO",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Gabriel Vasconcelos",n:50,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Ronan Vieira",n:200,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"José Francilino",n:200,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"JOSÉ DOS REIS BORGES",n:116,t:"B",s:"SIREMATCH",na:116,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Ronivaldo dos Reis Cardoso",n:50,t:"C",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VOLMAR CAIXETA",n:300,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VICENTE CAIXETA",n:200,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Jose Eustaquio Pereira Amorim",n:250,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VALERIO CORRÊA PERES",n:200,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"OTTO",n:200,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Marconi Ribeiro de Barros",n:60,t:"B",s:"VISITA LAGOA+",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"EGIDIO DA SILVA SANTANNA",n:83,t:"B",s:"SIREMATCH",na:83,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"CARLOS GUILHERME DE VASCONCELOS CARVALHO",n:421,t:"KAM",s:"SIREMATCH",na:421,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"",cl:"LEONARDO SOARES",n:0,t:"HOME OFFICE",s:"",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"GUSTAVO LEITE",n:90,t:"B",s:"COLETA HERD",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"TANIO ELIEZER ALVES",n:200,t:"B",s:"VISITA LAGOA+",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"MARCELO DE CARALHO",n:250,t:"B",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ROGERIO VICENTE BARBOSA",n:150,t:"B",s:"COLETA HERD",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"MARCOS CESAR NOGUEIRA",n:80,t:"B",s:"PROSPEC",na:2,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"JOEL GARCIA DE CARVALHO",n:150,t:"B",s:"VISITA TÉCNICA",na:3,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"MAIKENY SAMUEL PEREIRA COELHO",n:100,t:"B",s:"PROSPEC",na:0,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"SEBASTIÃO JOSE DE CARVALHO",n:250,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"MARCO ANTÔNIO COSTA",n:200,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"GENEX GENETICA BRASIL LTDA",n:0,t:"HOME OFFICE",s:"CLARIFIDE GO",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"13",c:"",cl:"CARLOS ALBERTO LUIZ DE ALMEIDA",n:0,t:"HOME OFFICE",s:"CLARIFIDE GO",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"NERALDO ANTONIO CAIXETA",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"ANTONIO RODRIGUES FILHO",n:200,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"PAULO FERNANDO",n:80,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Flavio - Fazenda Juá",n:700,t:"KAM",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Francisco - Zoom",n:100,t:"C",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Fazenda Philaladelphia",n:120,t:"B",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"PAULO NUNES DE ANDRADE",n:150,t:"B",s:"VISITA TÉCNICA",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Jaqueline dos Santos",n:50,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Aline Pavan",n:60,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Coopeagri",n:0,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Jussara Anhaia",n:50,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Nelson Dalbosco",n:80,t:"B",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Frizzo",n:0,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Odair Ferentz",n:60,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Tiago Tiburski",n:50,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Jelson Padilha",n:60,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Adriano Meaza",n:40,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Claudio Bizolli",n:50,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Iffar",n:40,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Prefeitura Rodeio Bonito",n:0,t:"KAM",s:"CURSO I.A.",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Adrei Bevilaqua",n:20,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Santo Três",n:40,t:"C",s:"Entrega de Sêmen",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Samuel Manske,",n:80,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Vanir Knapp",n:70,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Sergio Arnet",n:80,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:1,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Expodireto",n:0,t:"FEIRA/EVENTO",s:"",na:4,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Tchê Milk",n:0,t:"CONEXÃO LEITE",s:"PROSPEC",na:0,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"João Ariel Rambo",n:40,t:"CONEXÃO LEITE",s:"SIREMATCH",na:33,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Aldoir Marchiori",n:25,t:"CONEXÃO LEITE",s:"SIREMATCH",na:16,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Prefeitura Porto Vera Cruz",n:0,t:"FEIRA/EVENTO",s:"",na:50,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Mário José Bakes",n:70,t:"CONEXÃO LEITE",s:"SIREMATCH",na:55,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Vanderlei Inácio Hoss",n:75,t:"CONEXÃO LEITE",s:"SIREMATCH",na:56,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Ademercio Shaparin",n:200,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUCAS FERNANDO RUAS",cl:"Cristiano Paludo",n:80,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:4,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Mauro Chemim",n:200,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"WilsonRebelatto",n:250,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:3,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIZ AUGUSTO BATISTA CARNETI",cl:"Cristine Finkler Dreyer",n:80,t:"LAGOA+",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Tchê Milk",n:0,t:"CONEXÃO LEITE",s:"PROSPEC",na:3,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LEANDRO GRAFF",cl:"Gerson Kochenborger",n:60,t:"C",s:"INDICAÇÃO TOURO",na:3,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LEANDRO GRAFF",cl:"Cleber Rodrigo Carre",n:150,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:2,m:"mar-26"},
{e:"Henrique Froehlich",a:"18",c:"LEANDRO GRAFF",cl:"Ariel Eberts",n:80,t:"B",s:"PROSPEC",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Eliane Kassies",n:300,t:"KAM",s:"INDICAÇÃO TOURO",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Melkstad",n:2000,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Adilson Ostapoviski",n:90,t:"KAM",s:"COLETA HERD",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Juliano Jarek",n:300,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo tonon",n:350,t:"LAGOA+",s:"SIREMATCH",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Antonio Wogler",n:300,t:"KAM",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mark Allen Harvey",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Cristiane de Fatima Lodovirge",n:50,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Willy Frits Kugler",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"",cl:"",n:0,t:"",s:"",na:0,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Adilson Ostapoviski",n:0,t:"",s:"",na:0,m:""},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Antonio de Jesus Cardoso",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Pedro Gomes",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Elielson Carneiro",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Sebastiao Madureira",n:300,t:"KAM",s:"PROSPEC",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Fabio Madureira",n:400,t:"KAM",s:"PROSPEC",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Ana Maria Nordegraf",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Willen Aragom",n:300,t:"KAM",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gerson Zig",n:300,t:"KAM",s:"PROSPEC",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bernadete Maria Bart",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rogerio Kremer",n:250,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gelson Pedroso",n:150,t:"KAM",s:"SIREMATCH",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gesiel Carvalho Connor",n:700,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Silvestre Gherards",n:200,t:"KAM",s:"PROSPEC",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Eliane Steklain",n:60,t:"KAM",s:"SIREMATCH",na:60,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Adriano Wacherski",n:150,t:"KAM",s:"SIREMATCH",na:150,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Tonon",n:350,t:"LAGOA+",s:"SIREMATCH",na:350,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jair sebastião Carneiro",n:300,t:"LAGOA+",s:"ATUALIZAÇÃO HERD",na:300,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Clemente Gherards",n:200,t:"C",s:"PROSPEC LAGOA +",na:200,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Bulka",n:100,t:"C",s:"HOME OFFICE",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"CTP",n:300,t:"C",s:"PROSPEC",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Tarcisio Barth",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Antonio Iglesias Canha",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rosalina Rogoski",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Maria Benke",n:200,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mario de Araujo Barbosa",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Hugo Barth",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Patricia Aparecida de Almeida",n:50,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Dieter Weivert",n:200,t:"LAGOA+",s:"SIREMATCH",na:2,m:"mar-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gilmar Arthur Carneiro",n:100,t:"KAM",s:"SIREMATCH",na:100,m:"mar-26"},
{e:"Felipe Prestes",a:"20",c:"JOAO ALVES JUNIOR",cl:"ALEX SÁ ANTUNES RODRIGUES",n:42,t:"C",s:"SIREMATCH",na:26,m:"mar-26"},
{e:"Felipe Prestes",a:"15",c:"MAICON PUERTAS SORRILHA SILVA",cl:"VERA LUCIA DE CARVALHO",n:44,t:"B",s:"SIREMATCH",na:44,m:"mar-26"},
{e:"Felipe Prestes",a:"15",c:"MAICON PUERTAS SORRILHA SILVA",cl:"Edilson Joao de Abreu",n:603,t:"KAM",s:"SIREMATCH",na:603,m:"mar-26"},
{e:"Felipe Prestes",a:"18",c:"ADAO MARCOS MACHADO",cl:"Marcelo Ricken",n:375,t:"LAGOA+",s:"SIREMATCH",na:375,m:"mar-26"},
{e:"Felipe Prestes",a:"12",c:"ANNY QUEIROZ SILVA",cl:"VALDINEI FERREIRA DA SILVA",n:136,t:"B",s:"SIREMATCH",na:86,m:"abr-26"},
{e:"Felipe Prestes",a:"13",c:"WILSON MOREIRA MARIANO",cl:"DANILO BENA DE CAMPOS",n:60,t:"B",s:"SIREMATCH",na:10,m:"abr-26"},
{e:"Felipe Prestes",a:"15",c:"RAFAEL GRANDI RUZA",cl:"FERNANDO LUIS REBELATTO",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Carlos Adão Machado Hei",n:90,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Paulo Tonon",n:350,t:"LAGOA+",s:"SIREMATCH",na:350,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Alfredo Jank",n:150,t:"KAM",s:"SIREMATCH",na:150,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Ani Loss",n:250,t:"LAGOA+",s:"ENTREGA HERD",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Lariane Wacherski",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Gerson Kok",n:300,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Ana Maria Nordegraf",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Douwe Sibma",n:300,t:"KAM",s:"COLETA HERD",na:4,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jose Adilson Ostapoviski",n:90,t:"KAM",s:"COLETA HERD",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Ivonel Karmazin",n:90,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Adriano Ostapoviski",n:80,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Amadeu Ubert",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Sandro Souza",n:60,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Claudio Aparecido de Souza",n:70,t:"KAM",s:"COLETA HERD",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Eudinelle Copetti",n:90,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Rosalina Rogoski",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Neide Barreto",n:100,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan Petter",n:450,t:"LAGOA+",s:"ENTREGA HERD",na:3,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Elizabet Ertal",n:160,t:"LAGOA+",s:"SIREMATCH",na:160,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mark Allen Harvey",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Fabio Madureira",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Mario de Araujo Barbosa",n:400,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Bernadete Maria Bart",n:150,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Daniele Rents",n:100,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Jan gerrit Berendsen",n:400,t:"LAGOA+",s:"SIREMATCH",na:3,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"LOURIAN TELEGINSKI SIMIONATO",cl:"Fabio Bavoso Madureira",n:300,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"KEVELAN ALMEIDA DOS SANTOS",cl:"Claudio Aparecido de Souza",n:70,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Leandro Teixeira",a:"15",c:"ADAO MARCOS MACHADO",cl:"Ricardo Schuster",n:153,t:"KAM",s:"SIREMATCH",na:153,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Ronan Vieira",n:200,t:"B",s:"VISITA TÉCNICA",na:0,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"SÉRGIO VASCONCELOS",n:200,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"JAIME MAIA FONTEBOA",n:300,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"MARIO CEZAR DA SILVA",cl:"GLAUCIO",n:70,t:"B",s:"VISITA TÉCNICA",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"JOSE CARLOS PEREIRA",n:322,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"ADAUTO AQUINO",n:237,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"",cl:"Palestras no salão nobre da ABCZ / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Fazenda Quilombo / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Fazenda São Jose / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Agropastroril Irmãos Chiari / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Estancia K / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Fazenda São Caetano / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"11",c:"",cl:"Fazenda Mutum / Gira Técnica",n:0,t:"FEIRA/EVENTO",s:"",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"MONTE ALEGRE - ANTONIO CESAR",n:200,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"SOCIEDADE CULT E EDUCA DE GARCA LTDA",n:40,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"IDALINO MOREIRA DA SILVA E OUTROS",n:150,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"ALAN SERGIO LORENCETTI",n:40,t:"C",s:"VISITA TÉCNICA",na:2,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"CICERO COELHO PEDROSA",n:150,t:"KAM",s:"VISITA TÉCNICA",na:2,m:"abr-26"},
{e:"Érica Fonseca",a:"13",c:"JOSE ROBERTO RANGEL BARBOSA",cl:"ASSOC DE ENSINO DE MARILIA LTDA",n:70,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"JOSE RAIMUNDO SOARES LUCIANO",cl:"Vitor Ottoni",n:45,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ELISABETE JUNQUEIRA",n:200,t:"HOME OFFICE",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VALERIO CORRÊA PERES",n:200,t:"B",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Vanderlei Correa Peres",n:200,t:"B",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Alexandre Honorato",n:115,t:"KAM",s:"VISITA TÉCNICA",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"HUMBERTO RENATO",n:200,t:"KAM",s:"VISITA TÉCNICA",na:3,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"OTTON BATISTA DE MATOS",n:200,t:"KAM",s:"VISITA TÉCNICA",na:3,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"LUIS FELIPE BARBOSA SILVA",n:1000,t:"KAM",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"CARLOS ALEXANDRE DE FIGUEIREDO",n:100,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"BENONI JOSE DE LIMA",n:150,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"MARCIO ANTONIO RIBEIRO",n:80,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"VITOR CESAR DE MOURA JUNIOR",cl:"ADRIANO RESENDE BARBOSA",n:56,t:"HOME OFFICE",s:"SIREMATCH",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"JOÃO VITOR SOARES",n:150,t:"B",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"GILSON FERNANDES",n:150,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"BRUNO - FAZENDA ALAGOAS",n:60,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"VALERIO - FAZENDA ALAGOAS",n:80,t:"B",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"ANTONIO - FAZENDA ALAGOAS",n:80,t:"B",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Érica Fonseca",a:"12",c:"LEONARDO A. SOARES GONCALVES",cl:"Marconi Ribeiro de Barros",n:90,t:"LAGOA+",s:"COLETA HERD",na:3,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Tchê Milk",n:0,t:"CONEXÃO LEITE",s:"PROSPEC",na:4,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Robson Kremer",n:200,t:"B",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Aline Durigon",n:80,t:"B",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Ricardo Lunardi",n:200,t:"B",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Fernando Menegatti",n:150,t:"B",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Kailane Gehring",n:80,t:"C",s:"SIREMATCH",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Marcos Mazetto",n:50,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Sérgio Borga",n:70,t:"C",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"ANDRES MENDONCA HAUERS",cl:"Vori Deros",n:70,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Maiquel Friske",n:80,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Ivar Kreutz",n:300,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Joce Schaefer",n:150,t:"KAM",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Wilson Winter",n:120,t:"KAM",s:"PROSPEC",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Volmir Bergman",n:60,t:"C",s:"INDICAÇÃO TOURO",na:2,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Liane Rambo",n:50,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Jocemar Wagner",n:80,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Sonali Much",n:150,t:"C",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Djeison Brehm",n:80,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"LUIS FERNANDO PANIZ",cl:"Rafael Gustavo Dresh",n:70,t:"C",s:"PROSPEC",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Elvio Daneli",n:60,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Márcio Giarolometo",n:80,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Jian de Jesus",n:60,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Ricael Brunetto",n:50,t:"C",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Roselio Biensfield",n:60,t:"LAGOA+",s:"COLETA HERD",na:1,m:"abr-26"},
{e:"Henrique Froehlich",a:"18",c:"DARLAN ANTONIO CARLETI",cl:"Neverson Schenne",n:60,t:"LAGOA+",s:"COLETA HERD",na:1,m:"abr-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"CURSO DE IA NICOLE",n:0,t:"LAGOA+",s:"CURSO I.A.",na:6,m:"abr-26"},
{e:"César Oliveira",a:"11",c:"VALQUIRIA ALVES DE MORAIS MENDONCA",cl:"EDELVIM ANTONIO",n:180,t:"KAM",s:"PROSPEC LAGOA +",na:3,m:"abr-26"},
{e:"César Oliveira",a:"11",c:"VALQUIRIA ALVES DE MORAIS MENDONCA",cl:"ATAIR RIBEIRO",n:40,t:"B",s:"INDICAÇÃO TOURO",na:1,m:"abr-26"},
{e:"César Oliveira",a:"11",c:"VALQUIRIA ALVES DE MORAIS MENDONCA",cl:"MARIA DIVINA ROCHA /JUNINHO DA BICICLETARIA",n:130,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"César Oliveira",a:"11",c:"VALQUIRIA ALVES DE MORAIS MENDONCA",cl:"FERNANDO CERESA",n:400,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"César Oliveira",a:"11",c:"VALQUIRIA ALVES DE MORAIS MENDONCA",cl:"VINICIUS MENDONÇA",n:140,t:"KAM",s:"PROSPEC LAGOA +",na:1,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"MARCOS LUCIANO GONCALVES",n:90,t:"KAM",s:"INDICAÇÃO TOURO",na:2,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"MARCOS JOSE ROSSI",n:70,t:"B",s:"PROSPEC",na:2,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"PEDRO CARLOS PETEAN",n:110,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"MARCELO JOSE PRADO",n:140,t:"KAM",s:"PROSPEC LAGOA +",na:140,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"ANTONIO CARLOS GUERREIRO",n:80,t:"C",s:"SIREMATCH",na:80,m:"abr-26"},
{e:"César Oliveira",a:"12",c:"CEZAR VON ZUBEN",cl:"LUANA WOPEREIS",n:180,t:"KAM",s:"PROSPEC LAGOA +",na:2,m:"abr-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"Izaque de Campos Menezes",n:0,t:"C",s:"INDICAÇÃO TOURO",na:0,m:"abr-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"Gian Carlos dos Santos Oliveira",n:0,t:"C",s:"INDICAÇÃO TOURO",na:0,m:"abr-26"},
{e:"César Oliveira",a:"19",c:"DANIEL GUSTAVO DA SILVA",cl:"Gilmar Martins de Oliveira",n:0,t:"C",s:"INDICAÇÃO TOURO",na:0,m:"abr-26"},
];


// -----------------------------------------
// DADOS DE VENDAS / DOSES (set/25 – ago/26)
// Colunas: tecnico, mes, dosesNovos, meta, pctMeta, fatNovos, dosesAtivos, fatAtivos, totalDoses, totalFat
// -----------------------------------------

const VENDAS = [
  {t:"César Oliveira",   m:"set-25", dn:0,    meta:845,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"set-25", dn:20,   meta:845,  pct:2.37, fn:680,      da:45,  fa:3012,     td:65,   tf:3692     },
  {t:"Felipe Prestes",   m:"set-25", dn:160,  meta:845,  pct:18.93,fn:7450,     da:850, fa:78150,    td:1010, tf:85600    },
  {t:"Leandro Teixeira", m:"set-25", dn:120,  meta:845,  pct:14.2, fn:13200,    da:975, fa:65292,    td:1095, tf:78492    },
  {t:"Phillippe Monteiro",m:"set-25",dn:0,    meta:845,  pct:0,    fn:0,        da:200, fa:15000,    td:200,  tf:15000    },
  {t:"César Oliveira",   m:"out-25", dn:0,    meta:766,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"out-25", dn:0,    meta:766,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"out-25", dn:1000, meta:766,  pct:130.5,fn:30000,    da:480, fa:24880,    td:1480, tf:54880    },
  {t:"Leandro Teixeira", m:"out-25", dn:670,  meta:766,  pct:87.5, fn:39500,    da:40,  fa:2353.5,   td:710,  tf:41853.5  },
  {t:"Phillippe Monteiro",m:"out-25",dn:0,    meta:766,  pct:0,    fn:0,        da:50,  fa:5250,     td:50,   tf:5250     },
  {t:"César Oliveira",   m:"nov-25", dn:0,    meta:737,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"nov-25", dn:0,    meta:737,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"nov-25", dn:540,  meta:737,  pct:73.3, fn:26250,    da:260, fa:18450,    td:800,  tf:44700    },
  {t:"Leandro Teixeira", m:"nov-25", dn:1017, meta:737,  pct:137.9,fn:148095,   da:227, fa:22890,    td:1244, tf:170985   },
  {t:"César Oliveira",   m:"dez-25", dn:0,    meta:524,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"dez-25", dn:0,    meta:524,  pct:0,    fn:0,        da:240, fa:15300,    td:240,  tf:15300    },
  {t:"Felipe Prestes",   m:"dez-25", dn:0,    meta:524,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Phillippe Monteiro",m:"dez-25",dn:410,  meta:524,  pct:78.2, fn:25950,    da:160, fa:13200,    td:570,  tf:39150    },
  {t:"Leandro Teixeira", m:"dez-25", dn:50,   meta:524,  pct:9.5,  fn:8750,     da:0,   fa:0,        td:50,   tf:8750     },
  {t:"César Oliveira",   m:"jan-26", dn:0,    meta:653,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"jan-26", dn:0,    meta:653,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"jan-26", dn:0,    meta:653,  pct:0,    fn:0,        da:270, fa:15900,    td:270,  tf:15900    },
  {t:"Leandro Teixeira", m:"jan-26", dn:0,    meta:653,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"César Oliveira",   m:"fev-26", dn:0,    meta:678,  pct:0,    fn:0,        da:1593,fa:78353.5,  td:1593, tf:78353.5  },
  {t:"Érica Fonseca",    m:"fev-26", dn:260,  meta:678,  pct:38.3, fn:12942,    da:760, fa:44350,    td:1020, tf:57292    },
  {t:"Felipe Prestes",   m:"fev-26", dn:760,  meta:678,  pct:112.1,fn:78386,    da:770, fa:47000,    td:1530, tf:125386   },
  {t:"Leandro Teixeira", m:"fev-26", dn:70,   meta:678,  pct:10.3, fn:3299.8,   da:170, fa:7450,     td:240,  tf:10749.8  },
  {t:"César Oliveira",   m:"mar-26", dn:0,    meta:376,  pct:0,    fn:0,        da:4918,fa:162226.9, td:4918, tf:162226.9 },
  {t:"Érica Fonseca",    m:"mar-26", dn:371,  meta:376,  pct:98.7, fn:12334.9,  da:730, fa:30832.6,  td:1101, tf:43167.5  },
  {t:"Felipe Prestes",   m:"mar-26", dn:0,    meta:376,  pct:0,    fn:0,        da:60,  fa:3498,     td:60,   tf:3498     },
  {t:"Henrique Froehlich",m:"mar-26",dn:0,    meta:376,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Leandro Teixeira", m:"mar-26", dn:560,  meta:376,  pct:148.9,fn:47640,    da:340, fa:11365,    td:900,  tf:59005    },
  {t:"César Oliveira",   m:"abr-26", dn:100,  meta:663,  pct:15.1, fn:3976,     da:0,   fa:0,        td:100,  tf:3976     },
  {t:"Érica Fonseca",    m:"abr-26", dn:170,  meta:663,  pct:25.6, fn:10220,    da:260, fa:11155.1,  td:430,  tf:21375.1  },
  {t:"Henrique Froehlich",m:"abr-26",dn:100,  meta:663,  pct:15.1, fn:5330,     da:0,   fa:0,        td:100,  tf:5330     },
  {t:"Felipe Prestes",   m:"abr-26", dn:30,   meta:663,  pct:4.5,  fn:6760.3,   da:40,  fa:1800,     td:70,   tf:8560.3   },
  {t:"Leandro Teixeira", m:"abr-26", dn:240,  meta:663,  pct:36.2, fn:21032,    da:190, fa:15770,    td:430,  tf:36802    },
  {t:"César Oliveira",   m:"mai-26", dn:0,    meta:775,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"mai-26", dn:0,    meta:775,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"mai-26", dn:0,    meta:775,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Henrique Froehlich",m:"mai-26",dn:0,    meta:775,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Leandro Teixeira", m:"mai-26", dn:0,    meta:775,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"César Oliveira",   m:"jun-26", dn:0,    meta:781,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"jun-26", dn:0,    meta:781,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"jun-26", dn:0,    meta:781,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Henrique Froehlich",m:"jun-26",dn:0,    meta:781,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Leandro Teixeira", m:"jun-26", dn:0,    meta:781,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"César Oliveira",   m:"jul-26", dn:0,    meta:808,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"jul-26", dn:0,    meta:808,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"jul-26", dn:0,    meta:808,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Henrique Froehlich",m:"jul-26",dn:0,    meta:808,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Leandro Teixeira", m:"jul-26", dn:0,    meta:808,  pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"César Oliveira",   m:"ago-26", dn:0,    meta:1025, pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Érica Fonseca",    m:"ago-26", dn:0,    meta:1025, pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Felipe Prestes",   m:"ago-26", dn:0,    meta:1025, pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Henrique Froehlich",m:"ago-26",dn:0,    meta:1025, pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
  {t:"Leandro Teixeira", m:"ago-26", dn:0,    meta:1025, pct:0,    fn:0,        da:0,   fa:0,        td:0,    tf:0        },
];

// Helper: converte "set-25" → {month:8, year:2025}
const _MES_MAP = {jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
function _parseMesVendas(m) {
  if (!m) return null;
  const p = m.toLowerCase().split('-');
  const mi = _MES_MAP[p[0]];
  if (mi === undefined) return null;
  return { month: mi, year: 2000 + parseInt(p[1]) };
}
// Label legível: "set-25" → "Set/25"
function _fmtMesLabel(m) {
  if (!m) return m;
  const p = m.split('-');
  return p[0].charAt(0).toUpperCase() + p[0].slice(1) + '/' + p[1];
}
// Meses distintos na ordem do array VENDAS
const VENDAS_MESES = [...new Set(VENDAS.map(r => r.m))];
// Técnicos distintos na ordem do array VENDAS
const VENDAS_TECNICOS = [...new Set(VENDAS.map(r => r.t))];
// Formata valor monetário BR
function _fmtBRL(v) {
  if (!v) return 'R$ 0';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─────────────────────────────────────────
// NORMALIZACAO DO HISTORICO
// ─────────────────────────────────────────

const _MES = {jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
function _mesToDate(m) {
  if (!m) return null;
  const lo = m.toLowerCase().trim();
  // formato "01/10/2025"
  const dmy = lo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, 1);
  // formato "set-25", "out-25", etc.
  const parts = lo.split('-');
  const mi = _MES[parts[0]];
  if (mi === undefined) return null;
  const yr = 2000 + parseInt(parts[1]);
  return new Date(yr, mi, 1);
}

// Normaliza nome do especialista para corresponder ao USERS (sem acento)
function _normName(n) {
  const str = (n || '').trim();
  // Remoção manual de acentos (Hermes não suporta String.prototype.normalize)
  const accents = {
    'A': /[ÀÁÂÃÄÅ]/g, 'a': /[àáâãäå]/g,
    'E': /[ÈÉÊË]/g,   'e': /[èéêë]/g,
    'I': /[ÌÍÎÏ]/g,   'i': /[ìíîï]/g,
    'O': /[ÒÓÔÕÖØ]/g, 'o': /[òóôõöø]/g,
    'U': /[ÙÚÛÜ]/g,   'u': /[ùúûü]/g,
    'C': /[Ç]/g,      'c': /[ç]/g,
    'N': /[Ñ]/g,      'n': /[ñ]/g,
  };
  let out = str;
  for (const [rep, regex] of Object.entries(accents)) {
    out = out.replace(regex, rep);
  }
  return out;
}

// Converte area "20" → "020", "12" → "012" etc.
function _normArea(a) {
  if (!a) return '';
  const s = String(a).trim();
  if (s.length === 2) return '0' + s;
  return s;
}

// Mapeia servicos do historico (uppercase) para nomes mais legíveis
const _SERV_MAP = {
  'SIREMATCH': 'SireMatch', 'COLETA HERD': 'Coleta Herd',
  'ENTREGA HERD': 'Entrega Herd', 'INDICAÇÃO TOURO': 'Indicacao Touro',
  'INDICACAO TOURO': 'Indicacao Touro',
  'PROSPEC': 'Prospec', 'PROSPEC LAGOA +': 'Prospec Lagoa+',
  'VENDA HERD': 'Venda Herd', 'VISITA LAGOA+': 'Visita Lagoa+',
  'VISITA TÉCNICA': 'Visita Tecnica', 'VISITA TECNICA': 'Visita Tecnica',
  'CLARIFIDE GO': 'Clarifide Go', 'CURSO I.A.': 'Curso IA', 'CURSO IA': 'Curso IA',
  'HOME OFFICE': 'Home Office', 'FEIRA/EVENTO': 'Feira/Evento',
};
function _normServ(s) { return _SERV_MAP[s] || s || 'Outros'; }

const _CLI_MAP = {
  'B': 'B', 'C': 'C', 'KAM': 'KAM', 'LAGOA+': 'Lagoa+', 'CONEXÃO LEITE': 'Conexao Leite',
  'CONEXAO LEITE': 'Conexao Leite', 'HOME OFFICE': 'Home Office', 'FEIRA/EVENTO': 'Feira/Evento',
};
function _normCli(t) { return _CLI_MAP[t] || t || 'Outros'; }

const HISTORICO_VISITS = HISTORICO.map((r, i) => {
  const dt = _mesToDate(r.m);
  return {
    id: `hist-${i}`,
    technicianName: _normName(r.e),
    area: _normArea(r.a),
    consultant: r.c,
    propertyName: r.cl,
    clientName: r.cl,
    herdSize: r.n || 0,
    clientType: _normCli(r.t),
    serviceType: _normServ(r.s),
    animalCount: r.na || 0,
    milkAvg: 0,
    lactating: 0,
    dealClosed: false,
    notes: '',
    visitedAt: dt ? dt.toISOString() : null,
    isHistorico: true,
  };
});

// ─────────────────────────────────────────
// UTILITARIOS
// ─────────────────────────────────────────

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

async function load(key) {
  try { const r = await AsyncStorage.getItem(key); return r ? JSON.parse(r) : []; } catch { return []; }
}
async function save(key, data) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function openGoogleMaps(lat, lng) {
  Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`)
    .catch(() => Alert.alert('Nao foi possivel abrir o Google Maps.'));
}

// ─────────────────────────────────────────
// COMPONENTES COMPARTILHADOS
// ─────────────────────────────────────────

function Btn({ label, onPress, disabled, secondary, style }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.btn, secondary && s.btnSecondary, disabled && s.btnDisabled, style]}>
      <Text style={[s.btnText, secondary && s.btnTextSecondary]}>{label}</Text>
    </Pressable>
  );
}
function Label({ text }) { return <Text style={s.label}>{text}</Text>; }
function Hint({ text })  { return text ? <Text style={s.hint}>{text}</Text> : null; }
function Input({ label, hint, inputStyle, ...props }) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Label text={label} /> : null}
      <TextInput style={[s.input, inputStyle]} placeholderTextColor="#8a9dbf" {...props} />
      <Hint text={hint} />
    </View>
  );
}
function Chips({ label, options, value, onChange }) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Label text={label} /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {options.map(opt => (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[s.chip, value === opt && s.chipOn]}>
            <Text style={[s.chipText, value === opt && s.chipTextOn]}>{opt}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View>; }
function Empty({ msg }) { return <View style={s.empty}><Text style={s.emptyText}>{msg}</Text></View>; }
function Back({ onPress }) {
  return <Pressable onPress={onPress} style={s.back}><Text style={s.backText}>← Voltar</Text></Pressable>;
}
function PageTitle({ title, sub }) {
  return (
    <View style={s.pageTitle}>
      <Text style={s.pageTitleText}>{title}</Text>
      {sub ? <Text style={s.pageTitleSub}>{sub}</Text> : null}
    </View>
  );
}

// Branding CRV Lagoa
function BrandHeader({ size = 'large' }) {
  const big = size === 'large';
  return (
    <View style={s.brandWrap}>
      <View style={s.brandRow}>
        <Text style={[s.brandCRV, big && s.brandCRVLg]}>CRV </Text>
        <Text style={[s.brandLagoa, big && s.brandLagoaLg]}>Lagoa</Text>
      </View>
      <View style={s.brandTagWrap}>
        <Text style={[s.brandTag, big && s.brandTagLg]}>LAGOA+</Text>
      </View>
      {big && <Text style={s.brandSub}>Gestao de visitas tecnicas</Text>}
    </View>
  );
}

// Filtro compacto para o Dashboard
function FilterRow({ label, options, value, onChange }) {
  return (
    <View style={s.filterRow}>
      <Text style={s.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map(opt => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value === value ? 'all' : opt.value)}
            style={[s.filterChip, value === opt.value && s.filterChipOn]}
          >
            <Text style={[s.filterChipText, value === opt.value && s.filterChipTextOn]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// Componentes de grafico
function SectionTitle({ text }) { return <Text style={s.dashSection}>{text}</Text>; }
function BarRow({ label, value, maxValue, index }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 5 : 0) : 0;
  return (
    <View style={s.barRow}>
      <Text style={s.barLabel} numberOfLines={1}>{label}</Text>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }]} />
      </View>
      <Text style={s.barCount}>{value}</Text>
    </View>
  );
}
function SegmentBar({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return <Text style={[s.muted, { marginVertical: 8 }]}>Sem dados.</Text>;
  return (
    <View>
      <View style={s.segBar}>
        {data.filter(d => d.value > 0).map((d, i) => (
          <View key={d.label} style={[s.segment, { flex: d.value, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
        ))}
      </View>
      <View style={s.segLegendWrap}>
        {data.filter(d => d.value > 0).map((d, i) => (
          <View key={d.label} style={s.segLegend}>
            <View style={[s.segDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
            <Text style={s.segLegendText}>{d.label}: {d.value} ({Math.round(d.value / total * 100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function RateIndicator({ rate, closed, total }) {
  const color = rate >= 60 ? C.green : rate >= 30 ? '#FF9800' : '#F44336';
  return (
    <View style={s.rateWrap}>
      <View style={s.rateRow}>
        <Text style={[s.rateBig, { color }]}>{rate}%</Text>
        <View style={{ marginLeft: 16 }}>
          <Text style={s.rateDetail}>Negocios fechados: {closed}</Text>
          <Text style={s.rateDetail}>Total de visitas: {total}</Text>
        </View>
      </View>
      <View style={s.rateTrack}><View style={[s.rateFill, { width: `${rate}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: LOGIN
// ─────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('cesar@crv4all.com.br');
  const [password, setPassword] = useState('123456');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  async function handleLogin() {
    setError(''); setBusy(true);
    await new Promise(r => setTimeout(r, 400));
    const baseUser = USERS.find(u => u.email === email.trim().toLowerCase());
    if (!baseUser) { setBusy(false); setError('E-mail ou senha incorretos.'); return; }
    // Check for custom password stored in AsyncStorage
    const pwdRaw = await AsyncStorage.getItem(KEY.PASSWORDS);
    const pwdMap = pwdRaw ? JSON.parse(pwdRaw) : {};
    const expectedPwd = pwdMap[baseUser.email] ?? baseUser.password;
    if (password !== expectedPwd) { setBusy(false); setError('E-mail ou senha incorretos.'); return; }
    const user = baseUser;
    setBusy(false);
    await AsyncStorage.setItem(KEY.SESSION, JSON.stringify(user));
    onLogin(user);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.loginWrap} keyboardShouldPersistTaps="handled">
          <BrandHeader size="large" />
          <Card>
            <Input label="E-mail" value={email} onChangeText={setEmail}
              autoCapitalize="none" keyboardType="email-address" placeholder="seu@email.com" />
            <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <Btn label={busy ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={busy} />
          </Card>
          <Card style={s.credCard}>
            <Text style={s.credTitle}>Credenciais de teste</Text>
            {[
              { label: 'Tecnico', email: 'cesar@crv4all.com.br',    name: 'Cesar Oliveira'     },
              { label: 'Tecnico', email: 'erica@crv4all.com.br',    name: 'Erica Fonseca'      },
              { label: 'Tecnico', email: 'henrique@crv4all.com.br', name: 'Henrique Froehlich' },
              { label: 'Tecnico', email: 'leandro@crv4all.com.br',  name: 'Leandro Teixeira'   },
              { label: 'Tecnico', email: 'prestes@crv4all.com.br',  name: 'Felipe Prestes (Tecnico)' },
              { label: 'Gestor',  email: 'gestor@crv4all.com.br',   name: 'Felipe Prestes (Gestor)' },
            ].map(c => (
              <Pressable key={c.email} onPress={() => setEmail(c.email)} style={s.credRow}>
                <View style={[s.credBadge, c.label === 'Gestor' && s.credBadgeGestor]}>
                  <Text style={s.credBadgeText}>{c.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.credName}>{c.name}</Text>
                  <Text style={s.credEmail}>{c.email}</Text>
                </View>
                <Text style={s.credArrow}>→</Text>
              </Pressable>
            ))}
            <Text style={[s.hint, { marginTop: 8, textAlign: 'center' }]}>Senha para todos: 123456</Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: HOME
// ─────────────────────────────────────────

function HomeScreen({ session, go, onLogout }) {
  const [stats, setStats] = useState({ visits: 0, schedules: 0, clients: 0, techs: 0 });
  const isGestor = session?.role === 'gestor';

  useEffect(() => {
    (async () => {
      const [v, ag, cl, tk] = await Promise.all([
        load(KEY.VISITS), load(KEY.SCHEDULES), load(KEY.CLIENTS), load(KEY.TECHS),
      ]);
      setStats({ visits: v.length, schedules: ag.length, clients: cl.length, techs: tk.length });
    })();
  }, []);

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.homeHead}>
          <View style={{ flex: 1 }}>
            <BrandHeader size="small" />
          </View>
          <Pressable onPress={onLogout} style={s.logoutBtn}><Text style={s.logoutText}>Sair</Text></Pressable>
        </View>

        <View style={s.homeGreetBox}>
          <Text style={s.homeGreet}>Ola, {session.name}</Text>
          <Text style={s.homeMeta}>{isGestor ? 'Perfil: Gestor' : `Area ${session.area || '--'} • Offline`}</Text>
        </View>

        <View style={s.statsRow}>
          {[
            { lbl: 'Visitas',  val: stats.visits,    scr: 'visits'  },
            { lbl: 'Agendas',  val: stats.schedules, scr: 'agenda'  },
            { lbl: 'Clientes', val: stats.clients,   scr: 'clients' },
          ].map(c => (
            <Pressable key={c.lbl} onPress={() => go(c.scr)} style={s.statCard}>
              <Text style={s.statVal}>{c.val}</Text>
              <Text style={s.statLbl}>{c.lbl}</Text>
            </Pressable>
          ))}
        </View>

        {!isGestor && (
          <>
            <Card>
              <Text style={s.sectionTitle}>Acoes rapidas</Text>
              <View style={s.actGrid}>
                {[
                  { lbl: 'Nova visita',  scr: 'new-visit'    },
                  { lbl: 'Nova agenda',  scr: 'new-schedule' },
                  { lbl: 'Novo cliente', scr: 'new-client'   },
                  { lbl: 'Ver visitas',  scr: 'visits'       },
                ].map(a => (
                  <Pressable key={a.lbl} onPress={() => go(a.scr)} style={s.actBtn}>
                    <Text style={s.actBtnText}>{a.lbl}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
            <Pressable onPress={() => go('vendas-tecnico')} style={s.dashBtn}>
              <View style={{ flex: 1 }}>
                <Text style={s.dashBtnTitle}>Minhas Vendas</Text>
                <Text style={s.dashBtnSub}>Meta vs Realizado · Faturamento mensal</Text>
              </View>
              <Text style={s.dashBtnArrow}>→</Text>
            </Pressable>
            <Pressable onPress={() => go('change-password')} style={[s.dashBtn, { backgroundColor: '#1a3c7a' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.dashBtnTitle}>Alterar Senha</Text>
                <Text style={s.dashBtnSub}>Altere sua senha de acesso</Text>
              </View>
              <Text style={s.dashBtnArrow}>→</Text>
            </Pressable>
          </>
        )}

        {isGestor && (
          <>
            <Card style={s.gestorCard}>
              <Text style={s.sectionTitle}>Painel Gestor</Text>
              <View style={s.actGrid}>
                {[
                  { lbl: 'Ver visitas',  scr: 'visits'       },
                  { lbl: 'Ver agenda',   scr: 'agenda'       },
                  { lbl: 'Ver clientes', scr: 'clients'      },
                  { lbl: 'Nova agenda',  scr: 'new-schedule' },
                ].map(a => (
                  <Pressable key={a.lbl} onPress={() => go(a.scr)} style={s.actBtn}>
                    <Text style={s.actBtnText}>{a.lbl}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Pressable onPress={() => go('dashboard')} style={s.dashBtn}>
              <View style={{ flex: 1 }}>
                <Text style={s.dashBtnTitle}>Dashboard e Graficos</Text>
                <Text style={s.dashBtnSub}>Filtros por mes, area, tecnico · Graficos atualizados</Text>
              </View>
              <Text style={s.dashBtnArrow}>→</Text>
            </Pressable>

            <Pressable onPress={() => go('vendas-gestor')} style={[s.dashBtn, { backgroundColor: '#0d4a2a' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.dashBtnTitle}>Doses Vendidas</Text>
                <Text style={s.dashBtnSub}>Meta vs Realizado · Ranking · Faturamento</Text>
              </View>
              <Text style={s.dashBtnArrow}>→</Text>
            </Pressable>

            <Card style={s.techCardHome}>
              <View style={s.techCardHead}>
                <View>
                  <Text style={s.sectionTitle}>Tecnicos cadastrados</Text>
                  <Text style={s.muted}>{stats.techs} tecnico(s)</Text>
                </View>
                <Pressable onPress={() => go('new-tech')} style={s.techAddBtn}>
                  <Text style={s.techAddBtnText}>+ Novo</Text>
                </Pressable>
              </View>
              <Btn label="Gerenciar tecnicos" onPress={() => go('techs')} style={{ marginTop: 10 }} />
            </Card>
          </>
        )}

        <Card style={s.infoCard}>
          <Text style={s.sectionTitle}>Modo demonstracao</Text>
          <Text style={s.muted}>Dados salvos localmente no celular. Funciona sem internet.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: AGENDA
// ─────────────────────────────────────────

function AgendaScreen({ go, onBack, session }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const reload = useCallback(async () => {
    setBusy(true);
    const all = await load(KEY.SCHEDULES);
    const filtered = session?.role === 'gestor'
      ? all
      : all.filter(item => item.technicianName === session?.name);
    setItems(filtered);
    setBusy(false);
  }, [session]);
  useEffect(() => { reload(); }, [reload]);

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Agenda" sub={`${items.length} agendamento(s)`} />
        <Btn label="+ Novo agendamento" onPress={() => go('new-schedule')} style={s.mb8} />
        {busy ? <ActivityIndicator color={C.green} /> : items.length === 0 ? <Empty msg="Nenhum agendamento salvo." /> :
          items.map(item => (
            <Pressable key={item.id}
              onPress={() => item.clientName ? go('new-visit-from-schedule', item) : go('schedule-detail', item)}
              style={s.listCard}>
              {item.clientName ? <Text style={s.listClientName}>{item.clientName}</Text> : null}
              <Text style={s.listTitle}>{item.propertyName || '(sem propriedade)'}</Text>
              <Text style={s.muted}>{fmtDate(item.scheduledAt)}</Text>
              <Text style={s.muted}>Status: {item.status}</Text>
              {item.notes ? <Text style={s.muted}>{item.notes}</Text> : null}
              <Text style={[s.hint, { marginTop: 4 }]}>{item.clientName ? 'Registrar visita →' : 'Toque para ver detalhes →'}</Text>
            </Pressable>
          ))
        }
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: DETALHE DO AGENDAMENTO
// ─────────────────────────────────────────

function ScheduleDetailScreen({ schedule, onBack }) {
  if (!schedule) return <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}><Back onPress={onBack} /></View>;
  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Detalhes do Agendamento" />
        <Card>
          {schedule.clientName ? (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Cliente</Text>
              <Text style={s.detailValue}>{schedule.clientName}</Text>
            </View>
          ) : null}
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Propriedade</Text>
            <Text style={s.detailValue}>{schedule.propertyName || '(sem propriedade)'}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Data/Hora</Text>
            <Text style={s.detailValue}>{fmtDate(schedule.scheduledAt)}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Status</Text>
            <View style={[s.badge, s.badgeBlue]}>
              <Text style={s.badgeText}>{schedule.status || 'agendada'}</Text>
            </View>
          </View>
          {schedule.notes ? (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Observacoes</Text>
              <Text style={s.notesText}>"{schedule.notes}"</Text>
            </View>
          ) : null}
          {schedule.createdAt ? (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Criado em</Text>
              <Text style={s.detailValue}>{fmtDate(schedule.createdAt)}</Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: NOVO AGENDAMENTO
// ─────────────────────────────────────────

function NewScheduleScreen({ session, onBack, onSaved }) {
  const [clientName, setClientName] = useState('');
  const [prop,  setProp]  = useState('');
  const [date,  setDate]  = useState('');
  const [time,  setTime]  = useState('09:00');
  const [notes, setNotes] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [savedClients, setSavedClients] = useState([]);

  useEffect(() => { load(KEY.CLIENTS).then(setSavedClients); }, []);

  async function handleSave() {
    if (!clientName.trim()) { Alert.alert('Informe o nome do cliente.'); return; }
    if (!prop.trim())        { Alert.alert('Informe a propriedade.'); return; }
    if (!date.trim())        { Alert.alert('Informe a data (DD/MM/AAAA).'); return; }
    setBusy(true);
    const existing = await load(KEY.SCHEDULES);
    const parts = date.split('/');
    const iso = parts.length === 3
      ? `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}T${time}:00`
      : new Date().toISOString();
    await save(KEY.SCHEDULES, [
      { id: genId(), clientName: clientName.trim(), propertyName: prop.trim(),
        scheduledAt: iso, status: 'agendada', notes: notes.trim(), createdAt: new Date().toISOString(),
        technicianName: session?.name || '', area: session?.area || '' },
      ...existing,
    ]);
    setBusy(false);
    Alert.alert('Agenda salva!', '', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Novo agendamento" />
          <Card>
            <Input label="Nome do cliente" value={clientName} onChangeText={setClientName}
              placeholder="Ex: Joao da Silva"
              hint={savedClients.length > 0 ? `Clientes: ${savedClients.map(c => c.name).join(', ')}` : null} />
            <Input label="Propriedade" value={prop} onChangeText={setProp} placeholder="Ex: Fazenda Boa Esperanca" />
            <Input label="Data (DD/MM/AAAA)" value={date} onChangeText={setDate}
              keyboardType="numbers-and-punctuation" placeholder="Ex: 25/05/2026" />
            <Input label="Hora (HH:MM)" value={time} onChangeText={setTime}
              keyboardType="numbers-and-punctuation" placeholder="09:00" />
            <Input label="Observacoes (opcional)" value={notes} onChangeText={setNotes}
              placeholder="Anotacoes..." multiline inputStyle={s.multiline} />
            <Btn label={busy ? 'Salvando...' : 'Salvar agenda'} onPress={handleSave} disabled={busy} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: CLIENTES
// ─────────────────────────────────────────

function ClientsScreen({ go, onBack }) {
  const [items, setItems] = useState([]);
  const [busy,  setBusy]  = useState(true);
  const reload = useCallback(async () => { setBusy(true); setItems(await load(KEY.CLIENTS)); setBusy(false); }, []);
  useEffect(() => { reload(); }, [reload]);

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Clientes" sub={`${items.length} cliente(s)`} />
        <Btn label="+ Novo cliente" onPress={() => go('new-client')} style={s.mb8} />
        {busy ? <ActivityIndicator color={C.green} /> : items.length === 0 ? <Empty msg="Nenhum cliente salvo." /> :
          items.map(item => (
            <Card key={item.id} style={s.listCard}>
              <Text style={s.listTitle}>{item.name}</Text>
              <Text style={s.muted}>Tipo: {item.clientType} · Area: {item.area || '--'}</Text>
              {item.propertyName ? <Text style={s.muted}>Prop: {item.propertyName}</Text> : null}
              {item.city ? <Text style={s.muted}>{item.city}{item.state ? ` / ${item.state}` : ''}</Text> : null}
              {item.coords ? (
                <Pressable onPress={() => openGoogleMaps(item.coords.lat, item.coords.lng)} style={s.gpsLinkBtn}>
                  <Text style={s.gpsLinkText}>
                    GPS {item.coords.lat.toFixed(5)}, {item.coords.lng.toFixed(5)}  —  Abrir no Google Maps
                  </Text>
                </Pressable>
              ) : null}
            </Card>
          ))
        }
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: NOVO CLIENTE (GPS sem mapa)
// ─────────────────────────────────────────

function NewClientScreen({ session, onBack, onSaved }) {
  const [name,         setName]         = useState('');
  const [clientType,   setClientType]   = useState('B');
  const [propertyName, setPropertyName] = useState('');
  const [area,         setArea]         = useState(session?.area || '011');
  const [consultant,   setConsultant]   = useState(CONSULTORES[session?.area || '011']?.[0] || '');
  const [city,         setCity]         = useState('');
  const [stateUF,      setStateUF]      = useState('');
  const [busy,         setBusy]         = useState(false);
  const [coords,       setCoords]       = useState(null);
  const [locLoading,   setLocLoading]   = useState(false);
  const [locError,     setLocError]     = useState('');
  const [manualMode,   setManualMode]   = useState(false);
  const [manualLat,    setManualLat]    = useState('');
  const [manualLng,    setManualLng]    = useState('');

  function handleAreaChange(newArea) { setArea(newArea); setConsultant(CONSULTORES[newArea]?.[0] || ''); }

  async function handleGetGPS() {
    setLocError(''); setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocError('Permissao negada. Use o modo manual.'); setLocLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setManualMode(false);
    } catch { setLocError('GPS indisponivel. Use o modo manual.'); }
    setLocLoading(false);
  }

  function handleManualConfirm() {
    const lat = parseFloat(manualLat.replace(',', '.'));
    const lng = parseFloat(manualLng.replace(',', '.'));
    if (isNaN(lat) || isNaN(lng)) { setLocError('Coordenadas invalidas. Ex: Lat -19.9245  Lng -43.9352'); return; }
    setCoords({ lat, lng }); setManualMode(false); setLocError('');
  }

  function handleRemoveCoords() {
    setCoords(null); setManualLat(''); setManualLng(''); setLocError(''); setManualMode(false);
  }

  async function handleSave() {
    if (!name.trim())         { Alert.alert('Informe o nome do cliente.'); return; }
    if (!propertyName.trim()) { Alert.alert('Informe o nome da propriedade.'); return; }
    setBusy(true);
    const existing = await load(KEY.CLIENTS);
    await save(KEY.CLIENTS, [
      { id: genId(), name: name.trim(), clientType, propertyName: propertyName.trim(),
        area, consultant, city: city.trim(), state: stateUF.trim(), coords: coords || null,
        createdAt: new Date().toISOString() },
      ...existing,
    ]);
    setBusy(false);
    Alert.alert('Cliente salvo!', '', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Novo cliente" />
          <Card>
            <Input label="Nome do cliente / fazenda" value={name} onChangeText={setName} placeholder="Ex: Joao da Silva" />
            <Chips label="Tipo de cliente" options={CLIENT_TYPES} value={clientType} onChange={setClientType} />
            <Input label="Nome da propriedade" value={propertyName} onChangeText={setPropertyName} placeholder="Ex: Fazenda Boa Esperanca" />
            <Chips label="Area do consultor" options={AREAS} value={area} onChange={handleAreaChange} />
            <Input label="Consultor responsavel" value={consultant} onChangeText={setConsultant}
              placeholder="Nome do consultor"
              hint={`Sugestoes area ${area}: ${(CONSULTORES[area] || []).join(', ')}`} />
            <Input label="Cidade" value={city} onChangeText={setCity} placeholder="Ex: Uberlandia" />
            <Input label="Estado (sigla)" value={stateUF} onChangeText={setStateUF} placeholder="Ex: MG" maxLength={2} />
          </Card>
          <Card style={s.gpsCard}>
            <Text style={s.sectionTitle}>Localizacao GPS</Text>
            <Text style={[s.muted, { marginBottom: 12 }]}>Capture coordenadas para registro geografico (opcional).</Text>
            {!coords && (
              <View style={s.gpsBtnRow}>
                <Btn label={locLoading ? 'Buscando...' : 'Capturar GPS'} onPress={handleGetGPS}
                  disabled={locLoading} style={{ flex: 1, marginRight: 8 }} />
                <Btn label="Digitar manual" onPress={() => setManualMode(m => !m)} secondary style={{ flex: 1 }} />
              </View>
            )}
            {manualMode && !coords && (
              <View style={s.manualWrap}>
                <Text style={s.label}>Coordenadas manuais</Text>
                <Text style={[s.hint, { marginBottom: 8 }]}>
                  Pesquise no Google Maps, clique com botao direito e copie as coordenadas.
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[s.hint, { marginBottom: 4 }]}>Latitude</Text>
                    <TextInput style={s.input} placeholder="-19.9245" value={manualLat}
                      onChangeText={setManualLat} keyboardType="numbers-and-punctuation" placeholderTextColor="#8a9dbf" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.hint, { marginBottom: 4 }]}>Longitude</Text>
                    <TextInput style={s.input} placeholder="-43.9352" value={manualLng}
                      onChangeText={setManualLng} keyboardType="numbers-and-punctuation" placeholderTextColor="#8a9dbf" />
                  </View>
                </View>
                <Btn label="Confirmar coordenadas" onPress={handleManualConfirm} />
              </View>
            )}
            {locError ? <View style={[s.errorBox, { marginTop: 8 }]}><Text style={s.errorText}>{locError}</Text></View> : null}
            {coords ? (
              <View style={s.coordsBox}>
                <View style={s.coordsHeader}>
                  <Text style={s.coordsTitle}>Localizacao registrada</Text>
                  <Pressable onPress={handleRemoveCoords} style={s.coordsRemoveBtn}>
                    <Text style={s.coordsRemoveText}>Remover</Text>
                  </Pressable>
                </View>
                <View style={s.coordsGrid}>
                  <View style={s.coordsItem}>
                    <Text style={s.coordsItemLabel}>Latitude</Text>
                    <Text style={s.coordsItemValue}>{coords.lat.toFixed(6)}</Text>
                  </View>
                  <View style={s.coordsItem}>
                    <Text style={s.coordsItemLabel}>Longitude</Text>
                    <Text style={s.coordsItemValue}>{coords.lng.toFixed(6)}</Text>
                  </View>
                </View>
                <Pressable onPress={() => openGoogleMaps(coords.lat, coords.lng)} style={s.googleMapsBtn}>
                  <Text style={s.googleMapsBtnText}>Abrir no Google Maps</Text>
                </Pressable>
                <Pressable onPress={handleGetGPS} disabled={locLoading}
                  style={[s.refreshGpsBtn, locLoading && { opacity: 0.5 }]}>
                  <Text style={s.refreshGpsText}>{locLoading ? 'Atualizando...' : 'Recapturar GPS'}</Text>
                </Pressable>
              </View>
            ) : !locLoading && !manualMode ? (
              <View style={s.gpsEmpty}><Text style={s.gpsEmptyText}>Nenhuma localizacao registrada (opcional)</Text></View>
            ) : null}
          </Card>
          <Card><Btn label={busy ? 'Salvando...' : 'Salvar cliente'} onPress={handleSave} disabled={busy} /></Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: VISITAS
// ─────────────────────────────────────────

function VisitsScreen({ go, onBack, session }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    (async () => {
      setBusy(true);
      const all = await load(KEY.VISITS);
      const filtered = session?.role === 'gestor'
        ? all
        : all.filter(v => v.technicianName === session?.name);
      setItems(filtered);
      setBusy(false);
    })();
  }, [session]);

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Visitas registradas" sub={`${items.length} visita(s)`} />
        {busy ? <ActivityIndicator color={C.green} /> : items.length === 0
          ? <Empty msg={'Nenhuma visita registrada.\nUse "Nova visita" na Home.'} />
          : items.map(v => (
              <Card key={v.id} style={s.listCard}>
                <Text style={s.listTitle}>{v.propertyName || '(sem propriedade)'}</Text>
                <Text style={s.muted}>{fmtDate(v.visitedAt)}</Text>
                <Text style={s.muted}>Servico: {v.serviceType}</Text>
                <Text style={s.muted}>Tipo cliente: {v.clientType}</Text>
                <Text style={s.muted}>Rebanho: {v.herdSize} · Lactacao: {v.lactating} · Leite: {v.milkAvg} L/dia</Text>
                {v.animalCount ? <Text style={s.muted}>Animais acasalados: {v.animalCount}</Text> : null}
                <View style={[s.badge, v.dealClosed ? s.badgeBlue : s.badgeGray]}>
                  <Text style={s.badgeText}>{v.dealClosed ? 'Negocio fechado' : 'Sem negocio'}</Text>
                </View>
                {v.notes ? <Text style={s.notesText}>"{v.notes}"</Text> : null}
                {go && session?.role === 'gestor' && (
                  <Pressable onPress={() => go('edit-visit', v)} style={[s.editBtn, { marginTop: 8, alignSelf: 'flex-start' }]}>
                    <Text style={s.editBtnText}>Editar observacoes</Text>
                  </Pressable>
                )}
              </Card>
            ))
        }
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: NOVA VISITA
// ─────────────────────────────────────────

const VISIT_INIT = {
  propertyName: '', herdSize: '', clientType: 'B', serviceType: 'Prospec',
  animalCount: '', milkAvg: '', lactating: '', dealClosed: false,
  dosesConvencional: '', dosesSexado: '', consultant: '', notes: '',
};

function NewVisitScreen({ session, scheduleData, onBack, onSaved }) {
  const [form,    setForm]    = useState(() => {
    if (scheduleData) {
      return { ...VISIT_INIT, propertyName: scheduleData.propertyName || '' };
    }
    return VISIT_INIT;
  });
  const [errors,  setErrors]  = useState([]);
  const [busy,    setBusy]    = useState(false);
  const [clients, setClients] = useState([]);

  useEffect(() => { load(KEY.CLIENTS).then(setClients); }, []);

  // Quando clientes carregam, tentar pre-preencher clientType a partir do nome do cliente agendado
  useEffect(() => {
    if (!scheduleData || !scheduleData.clientName || clients.length === 0) return;
    const matched = clients.find(c => c.name === scheduleData.clientName);
    if (matched) {
      setForm(prev => ({
        ...prev,
        clientType: matched.clientType || prev.clientType,
      }));
    }
  }, [clients, scheduleData]);
  const needsAnimalCount = SERVICOS_COM_ANIMAIS.includes(form.serviceType);

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'serviceType' && !SERVICOS_COM_ANIMAIS.includes(value)) next.animalCount = '';
      return next;
    });
  }

  function validate() {
    const e = [];
    if (!form.propertyName.trim())                                                e.push('Informe a propriedade visitada.');
    if (!form.herdSize || Number(form.herdSize) <= 0)                             e.push('N rebanho deve ser maior que zero.');
    if (!form.clientType)                                                          e.push('Selecione o tipo de cliente.');
    if (!form.serviceType)                                                         e.push('Selecione o servico realizado.');
    if (needsAnimalCount && (!form.animalCount || Number(form.animalCount) <= 0)) e.push(`N animais obrigatorio para ${form.serviceType}.`);
    if (!form.milkAvg   || Number(form.milkAvg)   <= 0)                          e.push('Informe a producao media de leite.');
    if (!form.lactating  || Number(form.lactating)  <= 0)                         e.push('Informe os animais em lactacao.');
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]); setBusy(true);
    const existing = await load(KEY.VISITS);
    await save(KEY.VISITS, [
      { id: genId(), propertyName: form.propertyName.trim(),
        herdSize: Number(form.herdSize), clientType: form.clientType, serviceType: form.serviceType,
        animalCount: needsAnimalCount ? Number(form.animalCount) : null,
        milkAvg: Number(form.milkAvg), lactating: Number(form.lactating),
        dealClosed: form.dealClosed,
        dosesConvencional: form.dealClosed && form.dosesConvencional ? Number(form.dosesConvencional) : null,
        dosesSexado: form.dealClosed && form.dosesSexado ? Number(form.dosesSexado) : null,
        notes: form.notes.trim(),
        consultant: form.consultant || '',
        visitedAt: new Date().toISOString(),
        technicianName: session?.name || '', area: session?.area || '' },
      ...existing,
    ]);
    // Se veio de um agendamento, remover o agendamento da lista
    if (scheduleData && scheduleData.id) {
      const schedules = await load(KEY.SCHEDULES);
      await save(KEY.SCHEDULES, schedules.filter(sc => sc.id !== scheduleData.id));
    }
    setBusy(false);
    Alert.alert('Visita salva!', 'Registro salvo localmente.', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Nova visita" sub={scheduleData ? `Agendamento: ${scheduleData.clientName || scheduleData.propertyName}` : 'Preencha os dados da visita'} />
          {scheduleData ? (
            <View style={[s.infoCard, { marginBottom: 8 }]}>
              <Text style={s.sectionTitle}>Dados pre-preenchidos da agenda</Text>
              <Text style={s.muted}>Cliente: {scheduleData.clientName || '--'}</Text>
              <Text style={s.muted}>Propriedade: {scheduleData.propertyName || '--'}</Text>
              <Text style={s.muted}>Voce pode editar os campos antes de salvar.</Text>
            </View>
          ) : null}
          <Card>
            <Input label="Propriedade visitada" value={form.propertyName}
              onChangeText={v => set('propertyName', v)} placeholder="Nome da fazenda / propriedade"
              hint={clients.length > 0 ? `Clientes: ${clients.map(c => c.propertyName).filter(Boolean).join(', ')}` : null} />
            <Input label="N rebanho (total de animais)" value={form.herdSize}
              onChangeText={v => set('herdSize', v)} keyboardType="number-pad" placeholder="Ex: 120" />
            <Chips label="Tipo de cliente" options={CLIENT_TYPES} value={form.clientType} onChange={v => set('clientType', v)} />
            <Chips label="Servico realizado" options={SERVICE_TYPES} value={form.serviceType} onChange={v => set('serviceType', v)} />
            {session?.area && (CONSULTORES[session.area] || []).length > 0 && (
              <View style={s.fieldWrap}>
                <Text style={s.label}>Consultor responsavel</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
                  {(CONSULTORES[session.area] || []).map(opt => (
                    <Pressable key={opt} onPress={() => set('consultant', opt)}
                      style={[s.chip, form.consultant === opt && s.chipOn]}>
                      <Text style={[s.chipText, form.consultant === opt && s.chipTextOn]}>{opt}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
            {needsAnimalCount && (
              <View style={s.conditionalBox}>
                <Text style={s.conditionalLabel}>Campo obrigatorio para {form.serviceType}</Text>
                <Input label="N animais" value={form.animalCount} onChangeText={v => set('animalCount', v)}
                  keyboardType="number-pad" placeholder="Quantidade de animais" />
              </View>
            )}
            <Input label="Producao media de leite (L/dia)" value={form.milkAvg}
              onChangeText={v => set('milkAvg', v)} keyboardType="decimal-pad" placeholder="Ex: 25.5" />
            <Input label="Animais em lactacao" value={form.lactating}
              onChangeText={v => set('lactating', v)} keyboardType="number-pad" placeholder="Ex: 80" />
            <View style={s.switchRow}>
              <Text style={s.label}>Negocio fechado?</Text>
              <Switch value={form.dealClosed} onValueChange={v => set('dealClosed', v)}
                trackColor={{ false: C.border, true: C.green }} thumbColor={C.white} />
            </View>
            {form.dealClosed && (
              <View style={s.conditionalBox}>
                <Text style={s.conditionalLabel}>Doses vendidas</Text>
                <Input label="Doses Convencional" value={form.dosesConvencional}
                  onChangeText={v => set('dosesConvencional', v)} keyboardType="number-pad"
                  placeholder="Quantidade de doses convencional" />
                <Input label="Doses Sexado" value={form.dosesSexado}
                  onChangeText={v => set('dosesSexado', v)} keyboardType="number-pad"
                  placeholder="Quantidade de doses sexado" />
              </View>
            )}
            <Input label="Observacoes (opcional)" value={form.notes} onChangeText={v => set('notes', v)}
              placeholder="Anotacoes sobre a visita..." multiline inputStyle={s.multiline} />
            {errors.length > 0 && (
              <View style={s.errorBox}>{errors.map(e => <Text key={e} style={s.errorText}>• {e}</Text>)}</View>
            )}
            <Btn label={busy ? 'Salvando...' : 'Salvar visita'} onPress={handleSave} disabled={busy} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: EDITAR VISITA (observacoes)
// ─────────────────────────────────────────

function EditVisitScreen({ visit, onBack, onSaved }) {
  const [notes,      setNotes]      = useState(visit?.notes      || '');
  const [dealClosed, setDealClosed] = useState(visit?.dealClosed || false);
  const [dosesConv,  setDosesConv]  = useState(visit?.dosesConvencional ? String(visit.dosesConvencional) : '');
  const [dosesSex,   setDosesSex]   = useState(visit?.dosesSexado       ? String(visit.dosesSexado)       : '');
  const [busy,       setBusy]       = useState(false);

  async function handleSave() {
    setBusy(true);
    const existing = await load(KEY.VISITS);
    const updated = existing.map(v =>
      v.id === visit.id
        ? { ...v, notes: notes.trim(), dealClosed,
            dosesConvencional: dosesConv ? Number(dosesConv) : null,
            dosesSexado: dosesSex ? Number(dosesSex) : null }
        : v
    );
    await save(KEY.VISITS, updated);
    setBusy(false);
    Alert.alert('Visita atualizada!', '', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Editar visita" sub={visit?.propertyName || ''} />
          <Card>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Propriedade</Text>
              <Text style={s.detailValue}>{visit?.propertyName || '--'}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Data</Text>
              <Text style={s.detailValue}>{fmtDate(visit?.visitedAt)}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Servico</Text>
              <Text style={s.detailValue}>{visit?.serviceType || '--'}</Text>
            </View>
            <View style={s.switchRow}>
              <Text style={s.label}>Negocio fechado?</Text>
              <Switch value={dealClosed} onValueChange={setDealClosed}
                trackColor={{ false: C.border, true: C.green }} thumbColor={C.white} />
            </View>
            <Input label="Doses Convencional" value={dosesConv} onChangeText={setDosesConv}
              keyboardType="number-pad" placeholder="Quantidade de doses convencional" />
            <Input label="Doses Sexado" value={dosesSex} onChangeText={setDosesSex}
              keyboardType="number-pad" placeholder="Quantidade de doses sexado" />
            <Input label="Observacoes" value={notes} onChangeText={setNotes}
              placeholder="Anotacoes sobre a visita..." multiline inputStyle={s.multiline} />
            <Btn label={busy ? 'Salvando...' : 'Salvar alteracoes'} onPress={handleSave} disabled={busy} />
            <Btn label="Cancelar" onPress={onBack} secondary style={{ marginTop: 8 }} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: TECNICOS — com editar, sem area, com exportar
// ─────────────────────────────────────────

function TechsScreen({ go, onBack, onEdit }) {
  const [items,  setItems]  = useState([]);
  const [busy,   setBusy]   = useState(true);
  const [exBusy, setExBusy] = useState(false);

  const reload = useCallback(async () => { setBusy(true); setItems(await load(KEY.TECHS)); setBusy(false); }, []);
  useEffect(() => { reload(); }, [reload]);

  async function handleDelete(id) {
    Alert.alert('Remover tecnico', 'Deseja remover este tecnico?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        const updated = items.filter(t => t.id !== id);
        await save(KEY.TECHS, updated); setItems(updated);
      }},
    ]);
  }

  async function buildExportData() {
    const visits = await load(KEY.VISITS);
    return items.map(t => {
      const tv = visits.filter(v => v.technicianName === t.name);
      const closed = tv.filter(v => v.dealClosed).length;
      const totalAnimais = tv.reduce((sum, v) => sum + (v.animalCount || 0), 0);
      const totalDosesConv = tv.reduce((sum, v) => sum + (v.dosesConvencional || 0), 0);
      const totalDosesSex  = tv.reduce((sum, v) => sum + (v.dosesSexado || 0), 0);
      const services = {};
      tv.forEach(v => { if (v.serviceType) services[v.serviceType] = (services[v.serviceType] || 0) + 1; });
      const topService = Object.entries(services).sort((a, b) => b[1] - a[1])[0];
      return { nome: t.name, area: t.area || '--', email: t.email || '--',
               visitas: tv.length, negFechados: closed,
               taxaNeg: tv.length > 0 ? Math.round(closed / tv.length * 100) : 0,
               totalAnimais, totalDosesConv, totalDosesSex,
               topServico: topService ? `${topService[0]} (${topService[1]}x)` : '--' };
    });
  }

  async function handleExportExcel() {
    setExBusy(true);
    const data = await buildExportData();
    setExBusy(false);
    const linhas = data.map(r =>
      `${r.nome} | Area ${r.area} | ${r.visitas} visitas | ${r.negFechados} neg. fechados (${r.taxaNeg}%) | Animais acasalados: ${r.totalAnimais} | Doses Conv: ${r.totalDosesConv} | Doses Sex: ${r.totalDosesSex} | Top: ${r.topServico}`
    ).join('\n');
    Alert.alert(
      'Exportar Excel — Simulacao',
      data.length === 0
        ? 'Nenhum tecnico para exportar.'
        : `Relatorio de tecnicos:\n\n${linhas}\n\nTotal: ${items.length} tecnicos\n\nNa versao final, um arquivo .xlsx sera gerado.`,
      [{ text: 'OK' }]
    );
  }

  async function handleExportPDF() {
    setExBusy(true);
    const visits = await load(KEY.VISITS);
    setExBusy(false);
    const closed = visits.filter(v => v.dealClosed).length;
    const rate = visits.length > 0 ? Math.round(closed / visits.length * 100) : 0;
    const totalAnimais = visits.reduce((sum, v) => sum + (v.animalCount || 0), 0);
    const totalDosesConv = visits.reduce((sum, v) => sum + (v.dosesConvencional || 0), 0);
    const totalDosesSex  = visits.reduce((sum, v) => sum + (v.dosesSexado || 0), 0);
    Alert.alert(
      'Exportar PDF — Simulacao',
      `Relatorio Geral — CRV Lagoa\n\nTecnicos ativos: ${items.length}\nTotal de visitas: ${visits.length}\nNegocios fechados: ${closed} (${rate}%)\nAnimais acasalados: ${totalAnimais}\nDoses Convencional: ${totalDosesConv}\nDoses Sexado: ${totalDosesSex}\n\nNa versao final, um PDF sera gerado.`,
      [{ text: 'OK' }]
    );
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Tecnicos" sub={`${items.length} tecnico(s) cadastrado(s)`} />
        <Btn label="+ Cadastrar tecnico" onPress={() => go('new-tech')} style={s.mb8} />

        {busy ? <ActivityIndicator color={C.green} /> : items.length === 0
          ? <Empty msg={'Nenhum tecnico cadastrado.\nUse o botao acima para adicionar.'} />
          : items.map(item => (
              <Card key={item.id} style={s.listCard}>
                <View style={s.techCardRow}>
                  <Text style={[s.listTitle, { flex: 1 }]}>{item.name}</Text>
                  <Pressable onPress={() => onEdit(item)} style={s.editBtn}>
                    <Text style={s.editBtnText}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={[s.editBtn, s.deleteBtnBorder]}>
                    <Text style={s.deleteBtnText}>Remover</Text>
                  </Pressable>
                </View>
                {item.email ? <Text style={s.muted}>Email: {item.email}</Text> : null}
                {item.phone ? <Text style={s.muted}>Fone: {item.phone}</Text>  : null}
                {item.login ? <Text style={s.muted}>Login: {item.login}</Text> : null}
              </Card>
            ))
        }

        <Card style={s.exportCard}>
          <Text style={s.sectionTitle}>Exportar relatorios</Text>
          <Text style={[s.muted, { marginBottom: 12 }]}>
            Gere relatorios com os dados dos tecnicos e visitas registradas.
          </Text>
          <View style={s.exportBtns}>
            <Pressable onPress={handleExportExcel} disabled={exBusy} style={[s.exportBtn, s.exportBtnExcel]}>
              <Text style={s.exportBtnText}>{exBusy ? '...' : 'Exportar Excel'}</Text>
              <Text style={s.exportBtnSub}>.xlsx</Text>
            </Pressable>
            <Pressable onPress={handleExportPDF} disabled={exBusy} style={[s.exportBtn, s.exportBtnPDF]}>
              <Text style={s.exportBtnText}>{exBusy ? '...' : 'Exportar PDF'}</Text>
              <Text style={s.exportBtnSub}>.pdf</Text>
            </Pressable>
          </View>
          <Text style={[s.hint, { marginTop: 8, textAlign: 'center' }]}>
            Simulacao — exportacao real disponivel na versao com backend.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: NOVO TECNICO
// ─────────────────────────────────────────

function NewTechScreen({ onBack, onSaved }) {
  const [name,  setName]  = useState('');
  const [area,  setArea]  = useState('011');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [login, setLogin] = useState('');
  const [busy,  setBusy]  = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Informe o nome do tecnico.'); return; }
    setBusy(true);
    const existing = await load(KEY.TECHS);
    await save(KEY.TECHS, [
      { id: genId(), name: name.trim(), area, email: email.trim(), phone: phone.trim(), login: login.trim(), createdAt: new Date().toISOString() },
      ...existing,
    ]);
    setBusy(false);
    Alert.alert('Tecnico cadastrado!', '', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Cadastrar tecnico" />
          <Card>
            <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Ex: Cesar Oliveira" />
            <Chips label="Area" options={AREAS} value={area} onChange={setArea} />
            <Text style={[s.hint, { marginBottom: 12 }]}>
              Consultores area {area}: {(CONSULTORES[area] || []).join(', ')}
            </Text>
            <Input label="E-mail (opcional)" value={email} onChangeText={setEmail}
              placeholder="tecnico@empresa.com" autoCapitalize="none" keyboardType="email-address" />
            <Input label="Telefone (opcional)" value={phone} onChangeText={setPhone}
              placeholder="(00) 90000-0000" keyboardType="phone-pad" />
            <Input label="Login de acesso (opcional)" value={login} onChangeText={setLogin}
              placeholder="Ex: cesar.oliveira" autoCapitalize="none" />
            <Btn label={busy ? 'Salvando...' : 'Cadastrar tecnico'} onPress={handleSave} disabled={busy} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: EDITAR TECNICO
// ─────────────────────────────────────────

function EditTechScreen({ tech, onBack, onSaved }) {
  const [name,  setName]  = useState(tech?.name  || '');
  const [area,  setArea]  = useState(tech?.area  || '011');
  const [email, setEmail] = useState(tech?.email || '');
  const [phone, setPhone] = useState(tech?.phone || '');
  const [login, setLogin] = useState(tech?.login || '');
  const [busy,  setBusy]  = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Informe o nome do tecnico.'); return; }
    setBusy(true);
    const existing = await load(KEY.TECHS);
    const updated = existing.map(t =>
      t.id === tech.id
        ? { ...t, name: name.trim(), area, email: email.trim(), phone: phone.trim(), login: login.trim() }
        : t
    );
    await save(KEY.TECHS, updated);
    setBusy(false);
    Alert.alert('Tecnico atualizado!', '', [{ text: 'OK', onPress: onSaved }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Editar tecnico" sub={`Editando: ${tech?.name || ''}`} />
          <Card>
            <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Ex: Cesar Oliveira" />
            <Chips label="Area" options={AREAS} value={area} onChange={setArea} />
            <Text style={[s.hint, { marginBottom: 12 }]}>
              Consultores area {area}: {(CONSULTORES[area] || []).join(', ')}
            </Text>
            <Input label="E-mail" value={email} onChangeText={setEmail}
              placeholder="tecnico@empresa.com" autoCapitalize="none" keyboardType="email-address" />
            <Input label="Telefone" value={phone} onChangeText={setPhone}
              placeholder="(00) 90000-0000" keyboardType="phone-pad" />
            <Input label="Login de acesso" value={login} onChangeText={setLogin}
              placeholder="Ex: cesar.oliveira" autoCapitalize="none" />
            <Btn label={busy ? 'Salvando...' : 'Salvar alteracoes'} onPress={handleSave} disabled={busy} />
            <Btn label="Cancelar" onPress={onBack} secondary style={{ marginTop: 8 }} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: DASHBOARD com filtros
// ─────────────────────────────────────────

const FILTER_INIT = { month: 'all', area: 'all', tech: 'all', service: 'all', clientType: 'all' };

// ─────────────────────────────────────────
// TELA: VENDAS GESTOR (Meta vs Realizado)
// ─────────────────────────────────────────

function VendasGestorScreen({ onBack }) {
  const now = new Date();
  // Monta chave do mês atual no formato "mmm-aa"
  const _MES_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const mesAtualKey = _MES_NAMES[now.getMonth()] + '-' + String(now.getFullYear()).slice(2);
  // Seleciona o mês inicial: mês atual se existir nos dados, senão o último mês com dados
  const mesInicial = VENDAS_MESES.includes(mesAtualKey)
    ? mesAtualKey
    : VENDAS_MESES[VENDAS_MESES.length - 1];
  const [mesSel, setMesSel] = useState(mesInicial);

  const linhasMes = useMemo(
    () => VENDAS.filter(r => r.m === mesSel).sort((a, b) => b.pct - a.pct),
    [mesSel]
  );
  const maxDoses = useMemo(
    () => Math.max(1, ...linhasMes.map(r => Math.max(r.td, r.meta))),
    [linhasMes]
  );

  function PctBadge({ pct }) {
    const cor = pct >= 100 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';
    return (
      <View style={{ backgroundColor: cor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{pct.toFixed(1)}%</Text>
      </View>
    );
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Doses Vendidas" sub="Meta vs Realizado por tecnico" />

        {/* Seletor de mês */}
        <Card>
          <Text style={s.filterLabel}>Selecionar mes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {VENDAS_MESES.map(m => (
                <Pressable key={m} onPress={() => setMesSel(m)}
                  style={[s.filterChip, mesSel === m && s.filterChipOn, { marginBottom: 0 }]}>
                  <Text style={[s.filterChipText, mesSel === m && s.filterChipTextOn]}>
                    {_fmtMesLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Ranking */}
        <Card>
          <SectionTitle text={`Ranking — ${_fmtMesLabel(mesSel)}`} />
          {linhasMes.length === 0
            ? <Text style={s.muted}>Sem dados para este mes.</Text>
            : linhasMes.map((r, idx) => {
                const pctReal = r.meta > 0 ? (r.dn / r.meta) * 100 : 0;
                const barW = Math.min(100, (r.td / maxDoses) * 100);
                const metaW = Math.min(100, (r.meta / maxDoses) * 100);
                return (
                  <View key={r.t} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontWeight: '700', color: C.greenDark, fontSize: 14 }}>
                        {idx + 1}. {r.t.split(' ')[0]} {r.t.split(' ')[1] || ''}
                      </Text>
                      <PctBadge pct={pctReal} />
                    </View>
                    {/* Barra meta */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Text style={{ width: 60, fontSize: 11, color: C.muted }}>Meta</Text>
                      <View style={{ flex: 1, height: 10, backgroundColor: C.greenLight, borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${metaW}%`, height: 10, backgroundColor: C.border, borderRadius: 5 }} />
                      </View>
                      <Text style={{ width: 45, fontSize: 11, fontWeight: '700', color: C.muted, textAlign: 'right' }}>{r.meta}</Text>
                    </View>
                    {/* Barra realizado */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Text style={{ width: 60, fontSize: 11, color: C.greenDark }}>Vendido</Text>
                      <View style={{ flex: 1, height: 10, backgroundColor: C.greenLight, borderRadius: 5, overflow: 'hidden' }}>
                        <View style={{ width: `${barW}%`, height: 10, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length], borderRadius: 5 }} />
                      </View>
                      <Text style={{ width: 45, fontSize: 11, fontWeight: '700', color: C.greenDark, textAlign: 'right' }}>{r.td}</Text>
                    </View>
                    {/* Faturamento */}
                    <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Fat. total: {_fmtBRL(r.tf)}
                      {'  '}Novos: {r.dn} doses
                      {'  '}Ativos: {r.da} doses
                    </Text>
                  </View>
                );
              })}
        </Card>

        {/* Totais do mês */}
        {linhasMes.length > 0 && (
          <Card style={{ backgroundColor: '#f0f4ff' }}>
            <SectionTitle text="Totais do mes" />
            {(() => {
              const totDoses = linhasMes.reduce((s, r) => s + r.dn, 0);
              const totMeta  = linhasMes.reduce((s, r) => s + r.meta, 0);
              const totFat   = linhasMes.reduce((s, r) => s + r.tf, 0);
              const pctGeral = totMeta > 0 ? (totDoses / totMeta * 100) : 0;
              const pctGeralStr = pctGeral.toFixed(1);
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { label: 'Doses novos', val: String(totDoses),  color: C.green },
                    { label: 'Meta equipe', val: String(totMeta),   color: C.muted },
                    { label: '% Atingido',  val: pctGeralStr + '%', color: pctGeral >= 100 ? '#22c55e' : '#f59e0b' },
                    { label: 'Faturamento', val: _fmtBRL(totFat),   color: '#2196F3' },
                  ].map(k => (
                    <View key={k.label} style={[s.kpiCard, { borderTopColor: k.color, width: '47%' }]}>
                      <Text style={[s.kpiVal, { color: k.color, fontSize: 20 }]}>{k.val}</Text>
                      <Text style={s.kpiLabel}>{k.label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </Card>
        )}

        <Card style={s.infoCard}>
          <Text style={s.muted}>Dados do arquivo "doses vendidas.xlsx" — set/25 a ago/26. Meses sem venda mostram apenas a meta.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: VENDAS TECNICO (meu desempenho)
// ─────────────────────────────────────────

function VendasTecnicoScreen({ session, onBack }) {
  const _MES_NAMES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const now = new Date();
  const mesAtualKey = _MES_NAMES[now.getMonth()] + '-' + String(now.getFullYear()).slice(2);

  // Nome do técnico logado: normaliza para corresponder às chaves do VENDAS
  const nomeTec = session?.name || '';
  // Tenta correspondência exata, depois por primeiro+sobrenome sem acento
  function _normAccent(s) {
    return (s || '').replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
      .replace(/[òóôõöø]/g,'o').replace(/[ùúûü]/g,'u').replace(/[ç]/g,'c').replace(/[ñ]/g,'n')
      .replace(/[ÀÁÂÃÄÅ]/g,'A').replace(/[ÈÉÊË]/g,'E').replace(/[ÌÍÎÏ]/g,'I')
      .replace(/[ÒÓÔÕÖØ]/g,'O').replace(/[ÙÚÛÜ]/g,'U').replace(/[Ç]/g,'C').replace(/[Ñ]/g,'N');
  }
  const tecKey = VENDAS_TECNICOS.find(t => t === nomeTec)
    || VENDAS_TECNICOS.find(t => _normAccent(t) === _normAccent(nomeTec))
    || null;

  // Meses disponíveis para esse técnico
  const mesTec = useMemo(
    () => VENDAS_MESES.filter(m => VENDAS.some(r => r.m === m && (tecKey ? r.t === tecKey : false))),
    [tecKey]
  );
  const mesInicial = mesTec.includes(mesAtualKey)
    ? mesAtualKey
    : mesTec[mesTec.length - 1] || mesAtualKey;
  const [mesSel, setMesSel] = useState(mesInicial);

  const dado = tecKey ? VENDAS.find(r => r.t === tecKey && r.m === mesSel) : null;

  // Dias restantes no mês selecionado
  function diasRestantes(mKey) {
    const parsed = _parseMesVendas(mKey);
    if (!parsed) return null;
    const ultimo = new Date(parsed.year, parsed.month + 1, 0);
    const hoje = new Date();
    if (hoje.getMonth() !== parsed.month || hoje.getFullYear() !== parsed.year) return null;
    const diff = ultimo.getDate() - hoje.getDate();
    return diff >= 0 ? diff : 0;
  }
  const dias = diasRestantes(mesSel);
  const pctReal = dado && dado.meta > 0 ? Math.min(200, (dado.dn / dado.meta) * 100) : 0;
  const corPct = pctReal >= 100 ? '#22c55e' : pctReal >= 70 ? '#f59e0b' : '#ef4444';

  if (!tecKey) {
    return (
      <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
        <ScrollView contentContainerStyle={s.page}>
          <Back onPress={onBack} />
          <PageTitle title="Minhas Vendas" sub="Desempenho mensal" />
          <Card style={s.infoCard}>
            <Text style={s.muted}>Nenhum dado de vendas encontrado para {nomeTec}.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Minhas Vendas" sub={tecKey} />

        {/* Seletor de mês */}
        <Card>
          <Text style={s.filterLabel}>Mes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {mesTec.map(m => (
                <Pressable key={m} onPress={() => setMesSel(m)}
                  style={[s.filterChip, mesSel === m && s.filterChipOn, { marginBottom: 0 }]}>
                  <Text style={[s.filterChipText, mesSel === m && s.filterChipTextOn]}>
                    {_fmtMesLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Card principal */}
        {dado ? (
          <>
            {/* % atingimento grande */}
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 56, fontWeight: '900', color: corPct }}>{pctReal.toFixed(0)}%</Text>
              <Text style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>da meta (doses novos) atingido em {_fmtMesLabel(mesSel)}</Text>
              <View style={{ width: '100%', height: 14, backgroundColor: C.greenLight, borderRadius: 7, overflow: 'hidden', marginTop: 16 }}>
                <View style={{ width: `${Math.min(100, pctReal)}%`, height: 14, backgroundColor: corPct, borderRadius: 7 }} />
              </View>
              {dias !== null && (
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
                  {dias === 0 ? 'Ultimo dia do mes!' : `${dias} dia(s) restantes no mes`}
                </Text>
              )}
            </Card>

            {/* KPIs */}
            <View style={s.kpiRow}>
              {[
                { label: 'Doses novos',  val: String(dado.dn),    color: C.green    },
                { label: 'Meta mensal',  val: String(dado.meta),  color: C.muted    },
                { label: 'Total doses',  val: String(dado.td),    color: '#2196F3'  },
                { label: 'Doses ativos', val: String(dado.da),    color: '#FF9800'  },
              ].map(k => (
                <View key={k.label} style={[s.kpiCard, { borderTopColor: k.color }]}>
                  <Text style={[s.kpiVal, { color: k.color }]}>{k.val}</Text>
                  <Text style={s.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* Faturamento */}
            <Card>
              <SectionTitle text="Faturamento" />
              {[
                { label: 'Fat. Novos/Inativos', val: _fmtBRL(dado.fn) },
                { label: 'Fat. Ativos',          val: _fmtBRL(dado.fa) },
                { label: 'Total Faturamento',    val: _fmtBRL(dado.tf) },
              ].map(row => (
                <View key={row.label} style={[s.detailRow, { paddingBottom: 8, marginBottom: 8 }]}>
                  <Text style={s.detailLabel}>{row.label}</Text>
                  <Text style={[s.detailValue, { color: '#2196F3' }]}>{row.val}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <Card style={s.infoCard}>
            <Text style={s.muted}>Nenhum dado para {_fmtMesLabel(mesSel)}.</Text>
          </Card>
        )}

        <Card style={s.infoCard}>
          <Text style={s.muted}>Dados do arquivo "doses vendidas.xlsx". Apenas meses com dados cadastrados sao exibidos.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: DASHBOARD (visitas)
// ─────────────────────────────────────────

function DashboardScreen({ onBack, go }) {
  const [rawVisits,   setRawVisits]   = useState([]);
  const [busy,        setBusy]        = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters,     setFilters]     = useState(FILTER_INIT);

  useEffect(() => {
    load(KEY.VISITS).then(localV => {
      setRawVisits([...HISTORICO_VISITS, ...localV]);
      setBusy(false);
    });
  }, []);

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val === prev[key] ? 'all' : val }));
  }
  function clearFilters() { setFilters(FILTER_INIT); }
  const hasFilters = Object.values(filters).some(v => v !== 'all');

  const techOptions = useMemo(() => {
    const names = [...new Set(rawVisits.map(v => v.technicianName).filter(Boolean))].sort();
    return names.map(n => ({ label: n.split(' ')[0], value: n }));
  }, [rawVisits]);

  const serviceOptions = useMemo(() => {
    const svcs = [...new Set(rawVisits.map(v => v.serviceType).filter(Boolean))].sort();
    return svcs.map(t => ({ label: t.split(' ')[0], value: t }));
  }, [rawVisits]);

  const clientTypeOptions = useMemo(() => {
    const types = [...new Set(rawVisits.map(v => v.clientType).filter(Boolean))].sort();
    return types.map(t => ({ label: t, value: t }));
  }, [rawVisits]);

  const areaOptions = useMemo(() => {
    const areas = [...new Set(rawVisits.map(v => v.area).filter(Boolean))].sort();
    return areas.map(a => ({ label: a, value: a }));
  }, [rawVisits]);

  const visits = useMemo(() => {
    return rawVisits.filter(v => {
      if (filters.month !== 'all') {
        if (!v.visitedAt) return false;
        const d = new Date(v.visitedAt);
        const parts = filters.month.split('-');
        const fm = parseInt(parts[0]);
        const fy = parseInt(parts[1]);
        if (d.getMonth() !== fm || d.getFullYear() !== fy) return false;
      }
      if (filters.area       !== 'all' && v.area            !== filters.area)       return false;
      if (filters.tech       !== 'all' && v.technicianName   !== filters.tech)       return false;
      if (filters.service    !== 'all' && v.serviceType      !== filters.service)    return false;
      if (filters.clientType !== 'all' && v.clientType       !== filters.clientType) return false;
      return true;
    });
  }, [rawVisits, filters]);

  const stats = useMemo(() => {
    const RANKING_EXCLUIDOS = ['Suelen Soares', 'Phillippe Monteiro'];
    const byTechMap = {};
    visits.forEach(v => { const n = v.technicianName || 'Desconhecido'; byTechMap[n] = (byTechMap[n] || 0) + 1; });
    const byTech = Object.entries(byTechMap)
      .filter(([name]) => !RANKING_EXCLUIDOS.includes(name))
      .sort((a, b) => b[1] - a[1]);

    const byServiceMap = {};
    visits.forEach(v => { if (v.serviceType) byServiceMap[v.serviceType] = (byServiceMap[v.serviceType] || 0) + 1; });
    const byService = Object.entries(byServiceMap).sort((a, b) => b[1] - a[1]);

    const byClientMap = {};
    visits.forEach(v => { if (v.clientType) byClientMap[v.clientType] = (byClientMap[v.clientType] || 0) + 1; });
    const byClient = Object.entries(byClientMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

    const closed   = visits.filter(v => v.dealClosed).length;
    const dealRate = visits.length > 0 ? Math.round(closed / visits.length * 100) : 0;
    const milkVals = visits.map(v => Number(v.milkAvg)).filter(n => n > 0);
    const avgMilk  = milkVals.length > 0 ? (milkVals.reduce((a, b) => a + b, 0) / milkVals.length).toFixed(1) : '—';
    const herdVals = visits.map(v => Number(v.herdSize)).filter(n => n > 0);
    const avgHerd  = herdVals.length > 0 ? Math.round(herdVals.reduce((a, b) => a + b, 0) / herdVals.length) : '—';
    const totalAnimais   = visits.reduce((sum, v) => sum + (v.animalCount || 0), 0);
    const totalDosesConv = visits.reduce((sum, v) => sum + (v.dosesConvencional || 0), 0);
    const totalDosesSex  = visits.reduce((sum, v) => sum + (v.dosesSexado || 0), 0);

    return { total: visits.length, byTech, byService, byClient, dealRate, closed, avgMilk, avgHerd, totalAnimais, totalDosesConv, totalDosesSex };
  }, [visits]);

  if (busy) {
    return (
      <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
        <View style={s.page}><Back onPress={onBack} /><ActivityIndicator color={C.green} style={{ marginTop: 40 }} /></View>
      </View>
    );
  }

  const maxTech    = stats.byTech.length    > 0 ? stats.byTech[0][1]    : 1;
  const maxService = stats.byService.length > 0 ? stats.byService[0][1] : 1;

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <ScrollView contentContainerStyle={s.page}>
        <Back onPress={onBack} />
        <PageTitle title="Dashboard" sub="Visao geral das visitas tecnicas" />

        {/* Painel de filtros */}
        <Card style={s.filterCard}>
          <Pressable onPress={() => setShowFilters(f => !f)} style={s.filterToggle}>
            <View style={{ flex: 1 }}>
              <Text style={s.filterToggleTitle}>Filtros {hasFilters ? '(ativos)' : ''}</Text>
              {hasFilters
                ? <Text style={s.filterActiveHint}>{stats.total} de {rawVisits.length} visita(s) selecionadas</Text>
                : <Text style={s.filterActiveHint}>Mostrando todas as visitas</Text>}
            </View>
            <View style={[s.filterToggleBadge, hasFilters && s.filterToggleBadgeActive]}>
              <Text style={[s.filterToggleBadgeText, hasFilters && s.filterToggleBadgeTextActive]}>
                {showFilters ? '▲ Fechar' : '▼ Filtrar'}
              </Text>
            </View>
          </Pressable>

          {showFilters && (
            <View style={s.filterBody}>
              <FilterRow label="Mes" options={MONTHS} value={filters.month} onChange={val => setFilter('month', val)} />
              {areaOptions.length > 0 && (
                <FilterRow label="Area" options={areaOptions} value={filters.area} onChange={val => setFilter('area', val)} />
              )}
              {techOptions.length > 0 && (
                <FilterRow label="Tecnico" options={techOptions} value={filters.tech} onChange={val => setFilter('tech', val)} />
              )}
              <FilterRow label="Servico" options={serviceOptions}
                value={filters.service} onChange={val => setFilter('service', val)} />
              <FilterRow label="Cliente" options={clientTypeOptions}
                value={filters.clientType} onChange={val => setFilter('clientType', val)} />
              {hasFilters && (
                <Pressable onPress={clearFilters} style={s.clearFiltersBtn}>
                  <Text style={s.clearFiltersBtnText}>Limpar todos os filtros</Text>
                </Pressable>
              )}
            </View>
          )}
        </Card>

        {stats.total === 0 && (
          <Card style={s.infoCard}>
            <Text style={s.muted}>
              {hasFilters ? 'Nenhuma visita encontrada com os filtros selecionados.' : 'Nenhuma visita registrada ainda.'}
            </Text>
          </Card>
        )}

        {/* KPIs */}
        <View style={s.kpiRow}>
          {[
            { label: 'Total visitas',  value: stats.total,   color: C.green,    action: () => go && go('visits') },
            { label: 'Neg. fechados',  value: stats.closed,  color: '#2196F3',  action: null },
            { label: 'Leite med. (L)', value: stats.avgMilk, color: '#FF9800',  action: null },
            { label: 'Rebanho medio',  value: stats.avgHerd, color: '#9C27B0',  action: null },
          ].map(k => (
            k.action
              ? <Pressable key={k.label} onPress={k.action} style={[s.kpiCard, { borderTopColor: k.color }]}>
                  <Text style={[s.kpiVal, { color: k.color }]}>{k.value}</Text>
                  <Text style={s.kpiLabel}>{k.label} →</Text>
                </Pressable>
              : <View key={k.label} style={[s.kpiCard, { borderTopColor: k.color }]}>
                  <Text style={[s.kpiVal, { color: k.color }]}>{k.value}</Text>
                  <Text style={s.kpiLabel}>{k.label}</Text>
                </View>
          ))}
        </View>
        <View style={s.kpiRow}>
          {[
            { label: 'Animais acasalados', value: stats.totalAnimais,   color: '#4CAF50' },
            { label: 'Doses Conv.',         value: stats.totalDosesConv, color: '#009688' },
            { label: 'Doses Sex.',          value: stats.totalDosesSex,  color: '#E91E63' },
          ].map(k => (
            <View key={k.label} style={[s.kpiCard, { borderTopColor: k.color }]}>
              <Text style={[s.kpiVal, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        <Card>
          <SectionTitle text="Taxa de negocio fechado" />
          <RateIndicator rate={stats.dealRate} closed={stats.closed} total={stats.total} />
        </Card>

        <Card>
          <SectionTitle text="Ranking de tecnicos (visitas)" />
          {stats.byTech.length === 0 ? <Text style={s.muted}>Sem dados.</Text>
            : stats.byTech.map(([name, val], i) => <BarRow key={name} label={name} value={val} maxValue={maxTech} index={i} />)
          }
        </Card>

        <Card>
          <SectionTitle text="Visitas por tipo de servico" />
          {stats.byService.length === 0 ? <Text style={s.muted}>Sem dados.</Text>
            : stats.byService.map(([name, val], i) => <BarRow key={name} label={name} value={val} maxValue={maxService} index={i} />)
          }
        </Card>

        <Card>
          <SectionTitle text="Distribuicao por tipo de cliente" />
          <SegmentBar data={stats.byClient} />
        </Card>

        <Card style={s.infoCard}>
          <Text style={s.muted}>Dados historicos: {HISTORICO_VISITS.length} registros (set/25–abr/26) + visitas locais do dispositivo.</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// TELA: ALTERAR SENHA (tecnico)
// ─────────────────────────────────────────

function ChangePasswordScreen({ session, onBack, onChanged }) {
  const [senhaAtual,  setSenhaAtual]  = useState('');
  const [novaSenha,   setNovaSenha]   = useState('');
  const [confirmar,   setConfirmar]   = useState('');
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState('');

  async function handleSave() {
    setError('');
    if (!senhaAtual || !novaSenha || !confirmar) { setError('Preencha todos os campos.'); return; }
    if (novaSenha.length < 4) { setError('Nova senha deve ter pelo menos 4 caracteres.'); return; }
    if (novaSenha !== confirmar) { setError('Nova senha e confirmacao nao conferem.'); return; }
    setBusy(true);
    // Verify current password
    const pwdRaw = await AsyncStorage.getItem(KEY.PASSWORDS);
    const pwdMap = pwdRaw ? JSON.parse(pwdRaw) : {};
    const baseUser = USERS.find(u => u.email === session.email);
    const expectedPwd = pwdMap[session.email] ?? (baseUser ? baseUser.password : '');
    if (senhaAtual !== expectedPwd) { setBusy(false); setError('Senha atual incorreta.'); return; }
    // Save new password
    pwdMap[session.email] = novaSenha;
    await AsyncStorage.setItem(KEY.PASSWORDS, JSON.stringify(pwdMap));
    setBusy(false);
    Alert.alert('Senha alterada!', 'Sua senha foi atualizada com sucesso.', [{ text: 'OK', onPress: onChanged }]);
  }

  return (
    <View style={[s.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
          <Back onPress={onBack} />
          <PageTitle title="Alterar Senha" sub={session?.name || ''} />
          <Card>
            <Input label="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual}
              secureTextEntry placeholder="••••••" />
            <Input label="Nova senha" value={novaSenha} onChangeText={setNovaSenha}
              secureTextEntry placeholder="••••••" />
            <Input label="Confirmar nova senha" value={confirmar} onChangeText={setConfirmar}
              secureTextEntry placeholder="••••••" />
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <Btn label={busy ? 'Salvando...' : 'Alterar senha'} onPress={handleSave} disabled={busy} />
            <Btn label="Cancelar" onPress={onBack} secondary style={{ marginTop: 8 }} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────

export default function App() {
  const [session,     setSession]     = useState(null);
  const [ready,       setReady]       = useState(false);
  const [screen,      setScreen]      = useState('home');
  const [history,     setHistory]     = useState([]);
  const [editingTech, setEditingTech] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);

  const backRef = useRef({ history: [], screen: 'home' });
  useEffect(() => { backRef.current = { history, screen }; }, [history, screen]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const { history: h, screen: sc } = backRef.current;
      if (h.length > 0) {
        const prev = h[h.length - 1];
        setHistory(old => old.slice(0, -1)); setScreen(prev); return true;
      }
      if (sc !== 'home') { setScreen('home'); setHistory([]); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      // Seed tecnicos iniciais se ainda nao foram carregados
      const initialized = await AsyncStorage.getItem(KEY.INITIALIZED);
      if (!initialized) {
        await save(KEY.TECHS, INITIAL_TECHS);
        await AsyncStorage.setItem(KEY.INITIALIZED, '1');
      }
      const raw = await AsyncStorage.getItem(KEY.SESSION);
      if (raw) setSession(JSON.parse(raw));
      setReady(true);
    })();
  }, []);

  function go(to, data) {
    if (to === 'schedule-detail' && data) setSelectedSchedule(data);
    if (to === 'new-visit-from-schedule' && data) setSelectedSchedule(data);
    if (to === 'edit-visit' && data) setEditingVisit(data);
    setHistory(h => [...h, screen]); setScreen(to);
  }
  function back() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(old => old.slice(0, -1)); setScreen(prev);
    } else { setScreen('home'); }
  }
  function saved(returnTo = 'home') { setHistory([]); setScreen(returnTo); }
  async function logout() {
    await AsyncStorage.removeItem(KEY.SESSION);
    setSession(null); setScreen('home'); setHistory([]);
  }

  if (!ready) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={[s.muted, { marginTop: 12 }]}>Carregando...</Text>
      </View>
    );
  }

  if (!session) return <LoginScreen onLogin={u => { setSession(u); setScreen('home'); }} />;

  if (screen === 'home')             return <HomeScreen session={session} go={go} onLogout={logout} />;
  if (screen === 'agenda')           return <AgendaScreen go={go} onBack={back} session={session} />;
  if (screen === 'schedule-detail')  return <ScheduleDetailScreen schedule={selectedSchedule} onBack={back} />;
  if (screen === 'clients')          return <ClientsScreen go={go} onBack={back} />;
  if (screen === 'visits')           return <VisitsScreen go={go} onBack={back} session={session} />;
  if (screen === 'new-visit')        return <NewVisitScreen session={session} onBack={back} onSaved={() => saved('visits')} />;
  if (screen === 'new-visit-from-schedule') return <NewVisitScreen session={session} scheduleData={selectedSchedule} onBack={back} onSaved={() => { setSelectedSchedule(null); saved('visits'); }} />;
  if (screen === 'edit-visit')       return editingVisit
    ? <EditVisitScreen visit={editingVisit} onBack={back} onSaved={() => { setEditingVisit(null); saved('visits'); }} />
    : <HomeScreen session={session} go={go} onLogout={logout} />;
  if (screen === 'new-schedule')     return <NewScheduleScreen session={session} onBack={back} onSaved={() => saved('agenda')} />;
  if (screen === 'new-client')   return <NewClientScreen session={session} onBack={back} onSaved={() => saved('clients')} />;
  if (screen === 'techs')        return (
    <TechsScreen go={go} onBack={back} onEdit={tech => { setEditingTech(tech); go('edit-tech'); }} />
  );
  if (screen === 'new-tech')     return <NewTechScreen onBack={back} onSaved={() => saved('techs')} />;
  if (screen === 'edit-tech')    return editingTech
    ? <EditTechScreen tech={editingTech} onBack={back} onSaved={() => { setEditingTech(null); saved('techs'); }} />
    : <HomeScreen session={session} go={go} onLogout={logout} />;
  if (screen === 'dashboard')    return <DashboardScreen onBack={back} go={go} />;
  if (screen === 'vendas-gestor') return <VendasGestorScreen onBack={back} />;
  if (screen === 'vendas-tecnico') return <VendasTecnicoScreen session={session} onBack={back} />;
  if (screen === 'change-password') return <ChangePasswordScreen session={session} onBack={back} onChanged={() => saved('home')} />;

  return <HomeScreen session={session} go={go} onLogout={logout} />;
}

// ─────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.greenLight },
  splash:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenLight },
  page:     { paddingTop: STATUS_BAR_HEIGHT + 12, paddingHorizontal: 16, paddingBottom: 40 },

  // Branding
  brandWrap:    { alignItems: 'center', marginBottom: 20, marginTop: 12 },
  brandRow:     { flexDirection: 'row', alignItems: 'flex-end' },
  brandCRV:     { fontSize: 20, fontWeight: '800', color: C.greenDark },
  brandCRVLg:   { fontSize: 32 },
  brandLagoa:   { fontSize: 20, fontWeight: '800', color: C.green },
  brandLagoaLg: { fontSize: 32 },
  brandTagWrap: { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
  brandTag:     { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandTagLg:   { fontSize: 16 },
  brandSub:     { fontSize: 14, color: C.muted, marginTop: 8 },

  // Login
  loginWrap:       { flexGrow: 1, padding: 24, paddingTop: STATUS_BAR_HEIGHT + 12 },
  credCard:        { backgroundColor: '#f5f7ff', marginTop: 4 },
  credTitle:       { fontSize: 14, fontWeight: '700', color: C.greenDark, marginBottom: 10 },
  credRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  credBadge:       { backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 10 },
  credBadgeGestor: { backgroundColor: '#0d1f4a' },
  credBadgeText:   { color: C.white, fontSize: 11, fontWeight: '700' },
  credName:        { fontSize: 14, fontWeight: '600', color: C.greenDark },
  credEmail:       { fontSize: 12, color: C.muted },
  credArrow:       { color: C.muted, fontSize: 18 },

  // Home
  homeHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  homeGreetBox: { marginBottom: 14 },
  homeGreet:    { fontSize: 20, fontWeight: '700', color: C.greenDark },
  homeMeta:     { color: C.muted, fontSize: 13, marginTop: 2 },
  logoutBtn:    { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText:   { color: C.greenDark, fontWeight: '600', fontSize: 14 },
  statsRow:     { flexDirection: 'row', marginBottom: 12 },
  statCard:     { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 14, alignItems: 'center' },
  statVal:      { fontSize: 28, fontWeight: '800', color: C.greenDark },
  statLbl:      { fontSize: 13, color: C.muted, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.greenDark, marginBottom: 10 },
  actGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  actBtn:       { backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, marginBottom: 10 },
  actBtnText:   { color: C.white, fontWeight: '700', fontSize: 14 },
  infoCard:     { backgroundColor: '#e8edf8' },
  muted:        { color: C.muted, fontSize: 14, lineHeight: 20 },

  gestorCard:      { backgroundColor: '#f0f4ff' },
  techCardHome:    { backgroundColor: '#fff8e6', borderLeftWidth: 4, borderLeftColor: C.gold },
  techCardHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  techAddBtn:      { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  techAddBtnText:  { color: C.white, fontWeight: '700', fontSize: 13 },

  // Tecnico card row
  techCardRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  editBtn:        { borderWidth: 1, borderColor: '#2196F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  editBtnText:    { color: '#2196F3', fontWeight: '700', fontSize: 12 },
  deleteBtnBorder:{ borderColor: C.error },
  deleteBtnText:  { color: C.error, fontWeight: '700', fontSize: 12 },

  // Exportar
  exportCard:    { backgroundColor: '#f0f4ff' },
  exportBtns:    { flexDirection: 'row', gap: 10 },
  exportBtn:     { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  exportBtnExcel:{ backgroundColor: C.green },
  exportBtnPDF:  { backgroundColor: '#c0392b' },
  exportBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  exportBtnSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },

  // Dashboard button
  dashBtn:      { backgroundColor: C.greenDark, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  dashBtnTitle: { color: C.white, fontSize: 16, fontWeight: '700' },
  dashBtnSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3 },
  dashBtnArrow: { color: C.white, fontSize: 22, marginLeft: 10 },
  dashSection:  { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Filtros
  filterCard:              { backgroundColor: C.white, padding: 0, overflow: 'hidden' },
  filterToggle:            { flexDirection: 'row', alignItems: 'center', padding: 14 },
  filterToggleTitle:       { fontSize: 15, fontWeight: '700', color: C.greenDark },
  filterActiveHint:        { fontSize: 12, color: C.muted, marginTop: 2 },
  filterToggleBadge:       { backgroundColor: C.greenLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  filterToggleBadgeActive: { backgroundColor: C.green },
  filterToggleBadgeText:   { fontSize: 13, fontWeight: '600', color: C.muted },
  filterToggleBadgeTextActive: { color: C.white },
  filterBody:              { borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 8 },
  filterRow:               { marginBottom: 10 },
  filterLabel:             { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  filterChip:              { borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, marginRight: 6, backgroundColor: C.white },
  filterChipOn:            { backgroundColor: C.greenDark, borderColor: C.greenDark },
  filterChipText:          { fontSize: 12, color: C.muted, fontWeight: '600' },
  filterChipTextOn:        { color: C.white },
  clearFiltersBtn:         { alignSelf: 'center', marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.errorBg, borderRadius: 8 },
  clearFiltersBtnText:     { color: C.error, fontWeight: '700', fontSize: 13 },

  // KPIs
  kpiRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kpiCard:  { width: '47%', backgroundColor: C.white, borderRadius: 12, padding: 14, borderTopWidth: 3 },
  kpiVal:   { fontSize: 26, fontWeight: '800' },
  kpiLabel: { fontSize: 12, color: C.muted, marginTop: 2 },

  // Bar chart
  barRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 110, fontSize: 12, color: C.greenDark, fontWeight: '500', marginRight: 8 },
  barTrack: { flex: 1, height: 18, backgroundColor: C.greenLight, borderRadius: 9, overflow: 'hidden' },
  barFill:  { height: 18, borderRadius: 9 },
  barCount: { width: 28, fontSize: 12, fontWeight: '700', color: C.greenDark, textAlign: 'right', marginLeft: 6 },

  // Segment bar
  segBar:        { flexDirection: 'row', height: 22, borderRadius: 11, overflow: 'hidden', marginBottom: 12 },
  segment:       { height: 22 },
  segLegendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segLegend:     { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  segDot:        { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  segLegendText: { fontSize: 12, color: C.greenDark },

  // Rate
  rateWrap:   { marginBottom: 4 },
  rateRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rateBig:    { fontSize: 48, fontWeight: '900' },
  rateDetail: { fontSize: 13, color: C.muted, marginBottom: 2 },
  rateTrack:  { height: 14, backgroundColor: C.greenLight, borderRadius: 7, overflow: 'hidden' },
  rateFill:   { height: 14, borderRadius: 7 },

  // Cards
  card:       { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  listCard:   { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10 },
  listTitle:  { fontSize: 16, fontWeight: '700', color: C.greenDark, marginBottom: 2 },
  listClientName: { fontSize: 12, fontWeight: '700', color: C.green, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  // GPS
  gpsCard:          { backgroundColor: '#eef4ff', borderLeftWidth: 3, borderLeftColor: C.green },
  gpsBtnRow:        { flexDirection: 'row', marginBottom: 10 },
  manualWrap:       { backgroundColor: '#f5f7ff', borderRadius: 12, padding: 12, marginBottom: 10 },
  coordsBox:        { backgroundColor: '#dde7fa', borderRadius: 12, padding: 14, marginTop: 4 },
  coordsHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  coordsTitle:      { fontSize: 14, fontWeight: '700', color: C.greenDark },
  coordsRemoveBtn:  { borderWidth: 1, borderColor: C.error, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  coordsRemoveText: { color: C.error, fontWeight: '700', fontSize: 12 },
  coordsGrid:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  coordsItem:       { flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 10 },
  coordsItemLabel:  { fontSize: 11, color: C.muted, fontWeight: '600', marginBottom: 4 },
  coordsItemValue:  { fontSize: 15, fontWeight: '700', color: C.greenDark },
  googleMapsBtn:    { backgroundColor: C.green, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginBottom: 8 },
  googleMapsBtnText:{ color: C.white, fontWeight: '700', fontSize: 14 },
  refreshGpsBtn:    { borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  refreshGpsText:   { color: C.green, fontWeight: '600', fontSize: 13 },
  gpsEmpty:         { paddingVertical: 12, alignItems: 'center' },
  gpsEmptyText:     { color: C.muted, fontSize: 13 },
  gpsLinkBtn:       { marginTop: 8, backgroundColor: '#dde7fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  gpsLinkText:      { color: C.green, fontWeight: '700', fontSize: 12 },

  // Page title / nav
  pageTitle:     { marginBottom: 14 },
  pageTitleText: { fontSize: 22, fontWeight: '700', color: C.greenDark },
  pageTitleSub:  { fontSize: 14, color: C.muted, marginTop: 2 },
  back:          { marginBottom: 8 },
  backText:      { color: C.green, fontWeight: '600', fontSize: 15 },

  // Form
  fieldWrap: { marginBottom: 14 },
  label:     { fontSize: 14, fontWeight: '600', color: C.greenDark, marginBottom: 6 },
  hint:      { fontSize: 12, color: C.muted, marginTop: 4 },
  input:     { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#f8faff', fontSize: 15, color: C.greenDark },
  multiline: { minHeight: 90, textAlignVertical: 'top' },

  chipRow:    { flexDirection: 'row' },
  chip:       { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: C.white },
  chipOn:     { backgroundColor: C.green, borderColor: C.green },
  chipText:   { fontSize: 13, color: C.muted, fontWeight: '600' },
  chipTextOn: { color: C.white },

  switchRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingVertical: 4 },
  conditionalBox:   { borderLeftWidth: 3, borderLeftColor: C.green, paddingLeft: 12, backgroundColor: '#eef2fb', borderRadius: 10, padding: 10, marginBottom: 14 },
  conditionalLabel: { fontSize: 13, fontWeight: '700', color: C.green, marginBottom: 6 },

  errorBox:  { backgroundColor: C.errorBg, borderRadius: 10, padding: 12, marginBottom: 10 },
  errorText: { color: C.error, fontSize: 13, lineHeight: 20 },

  badge:      { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  badgeBlue:  { backgroundColor: '#dde7fa' },
  badgeGray:  { backgroundColor: '#f0f0f0' },
  badgeText:  { fontSize: 12, fontWeight: '700', color: C.greenDark },
  notesText:  { fontSize: 13, color: C.muted, fontStyle: 'italic', marginTop: 4 },

  btn:              { backgroundColor: C.green, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  btnSecondary:     { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.green },
  btnDisabled:      { opacity: 0.55 },
  btnText:          { color: C.white, fontSize: 15, fontWeight: '700' },
  btnTextSecondary: { color: C.green },

  empty:     { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: C.muted, fontSize: 15, textAlign: 'center' },
  mb8:       { marginBottom: 8 },

  // Detail rows (ScheduleDetailScreen, EditVisitScreen)
  detailRow:   { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: C.greenLight, paddingBottom: 10 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: C.greenDark },

  // Edit visit button
  editBtn:     { backgroundColor: '#eef2fb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.green },
  editBtnText: { color: C.green, fontWeight: '700', fontSize: 13 },
});
