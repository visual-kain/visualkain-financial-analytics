# API Contracts

This project uses the Supabase JavaScript Client SDK directly rather than a custom REST API. This document outlines the standard interaction patterns.

## Interaction Patterns

All data access is mediated through the Supabase SDK:

```javascript
// Querying
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

// Inserting
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: value }]);

// Updating
const { data, error } = await supabase
  .from('table_name')
  .update({ column: value })
  .eq('id', id);

// Deleting
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);
```

## Error Envelope

The standard error handling follows the Supabase envelope:

```json
{
  "data": null,
  "error": {
    "code": "PGRST116",
    "details": "The result contains 0 rows",
    "hint": null,
    "message": "JSON object requested, multiple (or no) rows returned"
  }
}
```

## Complex Operations

For operations that require complex transaction logic or aggregations that cannot be efficiently executed from the client, PostgreSQL RPC (Remote Procedure Call) functions will be deployed and invoked via:

```javascript
const { data, error } = await supabase.rpc('function_name', { arg: value });
```
