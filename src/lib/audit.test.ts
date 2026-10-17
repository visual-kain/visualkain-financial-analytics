import { describe, expect, it } from 'vitest';
import { actorFromUser, createdStamp, pickAudit, updatedStamp } from './audit';

describe('audit stamp', () => {
  it('nama diambil dari displayName, lalu dari email', () => {
    expect(actorFromUser({ displayName: 'Glora Sawita', email: 'glora@visualkain.com' })).toEqual({ name: 'Glora Sawita', email: 'glora@visualkain.com' });
    expect(actorFromUser({ displayName: null, email: 'raja.purnama@visualkain.com' })).toEqual({ name: 'Raja Purnama', email: 'raja.purnama@visualkain.com' });
    expect(actorFromUser(null)).toEqual({ name: '', email: '' });
  });

  it('stempel memakai nama field yang sama dengan order', () => {
    const actor = { name: 'Glora', email: 'g@vk.com' };
    expect(createdStamp(actor)).toEqual({ createdBy: 'Glora', createdByEmail: 'g@vk.com' });
    expect(updatedStamp(actor)).toEqual({ updatedBy: 'Glora', updatedByEmail: 'g@vk.com' });
  });

  it('pickAudit hanya menyalin field jejak yang terisi', () => {
    expect(pickAudit({ createdBy: ' Glora ', createdByEmail: '', updatedBy: 'Raja', nominal: 5 })).toEqual({ createdBy: 'Glora', updatedBy: 'Raja' });
    expect(pickAudit(null)).toEqual({});
    expect(pickAudit({ createdBy: 3 })).toEqual({});
  });
});
