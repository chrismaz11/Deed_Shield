function evaluateReceiptPolicy({
  jurisdiction,
  docType,
  notaryId,
  documentHash,
  contentBindingMode = 'attested',
  operatorConfirmed = false,
  textExtraction = { attempted: false, success: false, text: '' },
}) {
  const flags = [];
  if (!jurisdiction) flags.push('missing_jurisdiction');
  if (!docType) flags.push('missing_doc_type');
  if (!notaryId) flags.push('missing_notary_id');
  if (!documentHash) flags.push('doc_hash_missing');

  if (contentBindingMode === 'attested') {
    if (operatorConfirmed !== true) {
      flags.push('unconfirmed_metadata');
    }
  } else if (contentBindingMode === 'text_match') {
    if (!textExtraction.attempted || !textExtraction.success) {
      flags.push('text_extraction_failed');
    } else {
      const lower = String(textExtraction.text || '').toLowerCase();
      const jurOk = jurisdiction
        ? lower.includes(String(jurisdiction).toLowerCase())
        : false;
      const notaryTerm =
        (notaryId && lower.includes(String(notaryId).toLowerCase())) ||
        lower.includes('notary public') ||
        lower.includes('notary');
      if (!(jurOk && notaryTerm)) {
        flags.push('metadata_not_found_in_document');
      }
    }
  } else if (contentBindingMode === 'none') {
    flags.push('binding_not_performed');
  } else {
    flags.push('invalid_binding_mode');
  }

  const result = flags.length > 0 ? 'FLAG' : 'PASS';
  return { result, flags };
}

module.exports = {
  evaluateReceiptPolicy,
};
