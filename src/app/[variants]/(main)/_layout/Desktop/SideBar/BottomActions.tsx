import { memo } from 'react';




const BottomActions = memo(() => {
  // Return null to remove both buttons from the sidebar
  return null;

  // Original code commented out below:
  /*
  const { t } = useTranslation('common');
  const { hideGitHub, hideDocs } = useServerConfigStore(featureFlagsSelectors);

  return (
    <Flexbox gap={8}>
      {!hideGitHub && (
        <Link aria-label={'GitHub'} href={GITHUB} target={'_blank'}>
          <ActionIcon
            icon={Github}
            size={ICON_SIZE}
            title={'GitHub'}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {!hideDocs && (
        <Link aria-label={t('document')} href={DOCUMENTS_REFER_URL} target={'_blank'}>
          <ActionIcon
            icon={Book}
            size={ICON_SIZE}
            title={t('document')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
  */
});

export default BottomActions;
