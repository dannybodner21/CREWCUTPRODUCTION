import { Flexbox } from 'react-layout-kit';

import Files from './Files';

const Home = () => {
  return (
    <Flexbox gap={12} height={'100%'}>
      <Files />
    </Flexbox>
  );
};

export default Home;
