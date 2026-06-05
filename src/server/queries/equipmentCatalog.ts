import { prisma } from '@/lib/prisma';
import type { EquipmentPickerItem } from '@/components/character/wizard/EquipmentPicker';

/**
 * Catálogo de equipamento pro picker de "adicionar item" do inventário (mesmo
 * shape de card usado no wizard). Só os campos que o card precisa.
 */
export async function loadEquipmentCatalog(): Promise<EquipmentPickerItem[]> {
  return prisma.equipment.findMany({
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    select: {
      code: true,
      name: true,
      kind: true,
      subtype: true,
      category: true,
      damage: true,
      damageType: true,
      range: true,
      shortDescription: true,
    },
  });
}
