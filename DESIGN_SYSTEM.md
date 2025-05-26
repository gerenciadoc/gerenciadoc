# Documentação do Design System - Gerenciadoc

## Introdução

Este documento serve como referência permanente para o Design System do Gerenciadoc, implementado em Maio de 2025. O objetivo é garantir que todos os desenvolvedores, atuais e futuros, sigam as mesmas diretrizes visuais e de interação, mantendo a consistência e qualidade da experiência do usuário em todo o sistema.

## Princípios Fundamentais

O design do Gerenciadoc é guiado por princípios modernos de UI/UX, buscando criar uma interface:

- **Intuitiva e Eficiente:** Foco na clareza, usabilidade e na otimização dos fluxos de trabalho do usuário.
- **Confiável e Profissional:** Transmitir segurança e seriedade, adequadas a um software de gerenciamento.
- **Moderna e Adaptável:** Incorporar tendências visuais e tecnológicas relevantes, garantindo uma experiência atual e responsiva.
- **Acessível:** Seguir as diretrizes de acessibilidade (WCAG) para garantir que o software possa ser utilizado por todos.
- **Consistente:** Manter a uniformidade visual e de interação em toda a plataforma.

## Estrutura do Design System

O Design System do Gerenciadoc está estruturado da seguinte forma:

1. **Arquivo CSS Base:** `css/design-system.css` contém todos os tokens, variáveis e estilos base
2. **Framework Base:** Bootstrap 5 é utilizado como framework base, com customizações específicas
3. **Tipografia:** Google Fonts (Inter) é utilizado para toda a tipografia do sistema
4. **Ícones:** Font Awesome 6 é utilizado para todos os ícones do sistema

## Tokens e Variáveis

### Cores

```css
/* Cores Primárias */
--color-primary: #0052CC;
--color-primary-hover: #0747A6;
--color-primary-active: #043584;

/* Cores Secundárias */
--color-success: #36B37E;
--color-success-hover: #2E9E6B;
--color-success-active: #268C5F;
--color-teal: #00B8D9;
--color-teal-hover: #00A3BF;
--color-teal-active: #008DA3;

/* Cores Neutras */
--color-white: #FFFFFF;
--color-gray-100: #F4F5F7;
--color-gray-200: #DFE1E6;
--color-gray-300: #C1C7D0;
--color-gray-400: #A5ADBA;
--color-gray-500: #7A869A;
--color-gray-600: #6B778C;
--color-gray-700: #505F79;
--color-gray-800: #42526E;
--color-gray-900: #253858;
--color-black: #091E42;

/* Cores Semânticas */
--color-error: #DE350B;
--color-error-hover: #C62F0A;
--color-error-active: #AE2A09;
--color-warning: #FFAB00;
--color-warning-hover: #E69900;
--color-warning-active: #CC8800;
--color-info: var(--color-primary);
```

### Tipografia

```css
/* Tipografia */
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
--font-size-base: 16px;
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-md: 1rem;      /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 1.75rem;  /* 28px */
--font-size-4xl: 2rem;     /* 32px */

/* Font Weights */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.3;
--line-height-base: 1.5;
--line-height-relaxed: 1.6;
```

### Espaçamentos

```css
/* Espaçamentos */
--space-xxs: 0.25rem;  /* 4px */
--space-xs: 0.5rem;    /* 8px */
--space-sm: 0.75rem;   /* 12px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-xxl: 2.5rem;   /* 40px */
--space-xxxl: 3rem;    /* 48px */
--space-xxxxl: 4rem;   /* 64px */
```

### Bordas e Sombras

```css
/* Bordas e Arredondamentos */
--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
--border-width: 1px;
--border-width-thick: 2px;

/* Sombras */
--shadow-sm: 0 1px 3px rgba(9, 30, 66, 0.1);
--shadow-md: 0 3px 6px rgba(9, 30, 66, 0.15);
--shadow-lg: 0 8px 16px rgba(9, 30, 66, 0.2);
```

## Componentes Principais

### Botões

- **Primário:** Ação principal na tela. Fundo: Azul Corporativo (`#0052CC`), Texto: Branco (`#FFFFFF`).
- **Secundário:** Ação alternativa importante. Fundo: Transparente, Borda: Cinza Médio 1 (`#C1C7D0`), Texto: Cinza Escuro 3 (`#42526E`).
- **Terciário/Sutil:** Ações menos proeminentes. Fundo: Transparente, Texto: Cinza Escuro 3 (`#42526E`).
- **Destrutivo:** Ações perigosas (ex: excluir). Fundo: Erro (`#DE350B`), Texto: Branco (`#FFFFFF`).
- **Link:** Ações que se parecem com links. Fundo: Transparente, Texto: Azul Corporativo (`#0052CC`).

### Cards de Métricas

Os cards de métricas seguem um padrão específico:
- Borda colorida à esquerda indicando o tipo de métrica
- Ícone no canto superior direito com fundo suave da mesma cor
- Título em tamanho menor acima do valor
- Valor em tamanho grande e negrito

### Tabelas

- Cabeçalho com fundo cinza claro
- Linhas alternadas para melhor legibilidade
- Ações na última coluna com ícones intuitivos
- Status com badges coloridos

### Formulários

- Labels acima dos campos
- Espaçamento consistente entre campos
- Estados de foco, erro e desabilitado claramente indicados
- Mensagens de erro em vermelho abaixo do campo

### Modais

- Overlay semi-transparente
- Cabeçalho com título e botão de fechar
- Botões de ação no rodapé (primário à direita)
- Padding consistente

## Responsividade

O Design System é totalmente responsivo, adaptando-se a diferentes tamanhos de tela:

- **Mobile (até 767px):** Menu lateral colapsável, layout em coluna única
- **Tablet (768px a 991px):** Menu lateral mais estreito, layout em duas colunas
- **Desktop (992px e acima):** Layout completo com menu lateral fixo

## Implementação

Para implementar o Design System em novas páginas:

1. Incluir as dependências:
```html
<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<!-- Google Fonts - Inter -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- Font Awesome Icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<!-- Design System CSS -->
<link rel="stylesheet" href="css/design-system.css">
```

2. Seguir a estrutura básica:
```html
<div class="sidebar">
    <!-- Sidebar content -->
</div>

<div class="main-content">
    <div class="page-header">
        <!-- Page header content -->
    </div>
    
    <!-- Page content -->
</div>
```

3. Utilizar os componentes padronizados conforme documentados

## Manutenção e Evolução

O Design System deve evoluir com o produto, mas sempre mantendo a consistência. Para alterações:

1. Documentar a necessidade da mudança
2. Atualizar o arquivo `design-system.css`
3. Testar em todas as páginas existentes
4. Atualizar esta documentação

## Referências

- [Guia completo do Design System](link-para-documentacao-completa)
- [Paleta de cores](link-para-paleta)
- [Tipografia](link-para-tipografia)
- [Componentes](link-para-componentes)
- [Layout e espaçamento](link-para-layout)

---

*Última atualização: 26 de Maio de 2025*
