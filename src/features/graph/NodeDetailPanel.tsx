import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MessageSquareText, X } from 'lucide-react';
import type { GraphNode, OrgDirectory } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { EntityFacts, RelatedFindings, RelationshipGroups, useEntity } from '@/components/domain/EntityDetails';
import { Button, IconButton } from '@/components/ui/Button';
import { suggestedQuestion } from '@/lib/directory';
import { assistantPath, ENTITY_META, explorerPath } from '@/lib/entities';

interface NodeDetailPanelProps {
  node: GraphNode;
  directory: OrgDirectory;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function NodeDetailPanel({ node, directory, onSelect, onClose }: NodeDetailPanelProps) {
  const navigate = useNavigate();
  const entity = useEntity(node.id);
  const question = suggestedQuestion(node.type, node.name);

  return (
    <div className="flex h-full flex-col" aria-label={`Details for ${node.name}`} role="region">
      <header className="flex items-start gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-meta text-ink-3">
            <EntityGlyph type={node.type} />
            {ENTITY_META[node.type].label}
          </p>
          <h2 className="mt-0.5 text-title font-semibold break-words text-ink">{node.name}</h2>
        </div>
        <IconButton label="Close details" size="sm" onClick={onClose} className="-mt-0.5 -mr-1.5">
          <X className="size-4" aria-hidden />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {entity && <EntityFacts entity={entity} directory={directory} />}
        <RelatedFindings id={node.id} className="mt-4" />
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="mb-2 text-ui font-medium text-ink">Relationships</h3>
          <RelationshipGroups id={node.id} onSelect={onSelect} />
        </div>
      </div>

      <footer className="flex gap-2 border-t border-line p-3">
        <Button
          size="sm"
          className="flex-1"
          icon={<ArrowUpRight className="size-3.5" aria-hidden />}
          onClick={() => navigate(explorerPath(node.type, node.id))}
        >
          Open in Explorer
        </Button>
        <Button
          size="sm"
          className="flex-1"
          icon={<MessageSquareText className="size-3.5" aria-hidden />}
          onClick={() => navigate(assistantPath(question))}
        >
          Ask OrgMind
        </Button>
      </footer>
    </div>
  );
}
