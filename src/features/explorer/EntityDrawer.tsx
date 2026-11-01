import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Share2 } from 'lucide-react';
import type { OrgDirectory } from '@/api';
import { EntityGlyph } from '@/components/domain/entity';
import { EntityFacts, RelatedFindings, RelationshipGroups, useEntity } from '@/components/domain/EntityDetails';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Overlay';
import { EmptyState } from '@/components/ui/States';
import { useOrgData } from '@/hooks/useOrgData';
import { suggestedQuestion } from '@/lib/directory';
import { assistantPath, ENTITY_META, explorerPath, graphPath } from '@/lib/entities';

interface EntityDrawerProps {
  id: string;
  directory: OrgDirectory;
  onClose: () => void;
}

export function EntityDrawer({ id, directory, onClose }: EntityDrawerProps) {
  const navigate = useNavigate();
  const { node } = useOrgData();
  const entity = useEntity(id);
  const graphNode = node(id);

  if (!entity || !graphNode) {
    return (
      <Drawer title="Not found" onClose={onClose}>
        <EmptyState title="This entity does not exist" description="It may have been removed from the organization model." />
      </Drawer>
    );
  }

  const question = suggestedQuestion(entity.type, graphNode.name);

  return (
    <Drawer
      title={graphNode.name}
      description={
        <span className="flex items-center gap-1.5 text-meta text-ink-3">
          <EntityGlyph type={entity.type} />
          {ENTITY_META[entity.type].label}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <Button icon={<Share2 className="size-3.5" aria-hidden />} onClick={() => navigate(graphPath(id))}>
            View in graph
          </Button>
          <Button icon={<MessageSquareText className="size-3.5" aria-hidden />} onClick={() => navigate(assistantPath(question))}>
            Ask OrgMind
          </Button>
        </>
      }
    >
      <EntityFacts entity={entity} directory={directory} />
      <RelatedFindings id={id} className="mt-5" />
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="mb-2 text-ui font-medium text-ink">Relationships</h3>
        <RelationshipGroups
          id={id}
          onSelect={(nodeId) => {
            const target = node(nodeId);
            if (target) navigate(explorerPath(target.type, nodeId));
          }}
        />
      </div>
    </Drawer>
  );
}
