# ASL Viewer - Novas Funcionalidades Adicionadas

## Resumo das Implementações

### 1. Suporte a Múltiplas Fontes de Entrada

- **Definição direta**: Objetos ASL ou strings JSON/YAML
- **URL**: Carregamento de workflows a partir de URLs
- **Upload de arquivo**: Suporte a drag & drop e seleção de arquivos

### 2. Suporte a YAML

- Integração com a biblioteca `js-yaml` para parsing robusto
- Suporte completo a estruturas YAML complexas (arrays, objetos aninhados)
- Detecção automática de formato baseada em extensão e content-type

### 3. Novos Componentes

- **WorkflowViewer** atualizado com novas props
- **FileUploader**: Componente para upload de arquivos com drag & drop
- **URLInput**: Componente para entrada de URLs

### 4. Gerenciamento de Estado de Loading

- Estados de loading, sucesso e erro
- Callbacks para eventos de carregamento
- Feedback visual durante o carregamento

### 5. Melhorias na API

#### WorkflowViewer Props Atualizadas:

```typescript
interface WorkflowViewerProps {
  // Entrada (apenas uma deve ser fornecida)
  definition?: ASLDefinition | string;
  url?: string;
  file?: File;

  // Callbacks de loading
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onLoadError?: (error: Error) => void;

  // Props existentes mantidas
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  readonly?: boolean;
  onStateClick?: (state: StateNode) => void;
  onValidationError?: (error: ValidationError) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

### 6. Utilitários Exportados

```typescript
// Novos utilitários
export { loadFromURL, loadFromFile, parseDefinitionString } from "asl-viewer";
export { FileUploader, URLInput } from "asl-viewer";
```

### 7. Exemplos de Uso

#### Carregamento via URL:

```tsx
<WorkflowViewer
  url="https://example.com/workflow.json"
  onLoadStart={() => console.log("Carregando...")}
  onLoadEnd={() => console.log("Carregado!")}
  onLoadError={(error) => console.error("Erro:", error)}
/>
```

#### Upload de arquivo:

```tsx
const [file, setFile] = useState<File | null>(null);

return (
  <div>
    <FileUploader onFileSelect={setFile} theme={theme} />
    {file && <WorkflowViewer file={file} />}
  </div>
);
```

#### String YAML:

```tsx
const yamlWorkflow = `
Comment: "Workflow em YAML"
StartAt: "Hello"
States:
  Hello:
    Type: "Pass"
    Result: "Hello World!"
    End: true
`;

<WorkflowViewer definition={yamlWorkflow} />;
```

### 8. Formatos Suportados

- **JSON**: Formato padrão ASL
- **YAML**: Formato legível para humanos
- **Detecção automática**: Por extensão (.json, .yaml, .yml) ou content-type

### 9. Tratamento de Erros Melhorado

- Erros de parsing YAML/JSON
- Erros de carregamento de URL/arquivo
- Feedback visual de erros
- Integração com callbacks de validação existentes

### 10. Testes Implementados

- Testes unitários para parser YAML
- Testes para carregamento de arquivo
- Testes para diferentes formatos
- Mocks adequados para ambiente Node.js

### 11. Documentação Atualizada

- README atualizado com novos exemplos
- Storybook com stories para cada funcionalidade
- Documentação da API completa
- Exemplos de arquivos YAML e JSON

## Compatibilidade

- ✅ Mantém 100% de compatibilidade com API existente
- ✅ Props antigas continuam funcionando
- ✅ Todos os testes passando
- ✅ Build funcionando corretamente
- ✅ TypeScript totalmente tipado

## Arquivos Modificados/Criados

- `src/types.ts` - Novas interfaces
- `src/utils/loader.ts` - Novo utilitário para carregamento
- `src/components/WorkflowViewer.tsx` - Atualizado com novas funcionalidades
- `src/components/FileUploader.tsx` - Novo componente
- `src/components/WorkflowViewer.stories.tsx` - Novas stories
- `src/index.ts` - Exportações atualizadas
- `README.md` - Documentação atualizada
- `examples/choice-workflow.yaml` - Exemplo YAML
- Testes correspondentes

O erro original "state.Choices is not iterable" foi resolvido com a integração da biblioteca `js-yaml`, que faz o parsing correto de arrays YAML.
