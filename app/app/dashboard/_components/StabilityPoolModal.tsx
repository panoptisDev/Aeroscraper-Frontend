import GradientButton from '@/components/Buttons/GradientButton';
import InputLayout from '@/components/Input/InputLayout';
import { Modal } from '@/components/Modal/Modal';
import Text from '@/components/Texts/Text';
import Info from '@/components/Tooltip/Info';
import React, { FC, useState } from 'react'
import OutlinedButton from '@/components/Buttons/OutlinedButton';
import { NumericFormat } from 'react-number-format';
import { motion } from 'framer-motion';
import useAppContract from '@/contracts/app/useAppContract';
import { useNotification } from '@/contexts/NotificationProvider';
import { PageData } from '../_types/types';

enum TABS {
  DEPOSIT = 0,
  WITHDRAW
}

type Props = {
  open: boolean;
  onClose?: () => void;
  pageData: PageData;
}

const StabilityPoolModal: FC<Props> = ({ open, onClose, pageData }) => {

  const contract = useAppContract();
  const { addNotification } = useNotification();

  const [selectedTab, setSelectedTab] = useState<TABS>(TABS.DEPOSIT);

  const [processLoading, setProcessLoading] = useState(false);

  const [amount, setAmount] = useState<number>(0);

  const [balance, setBalance] = useState<number>(pageData.ausdBalance);

  const stakePool = async () => {
    setProcessLoading(true);

    try {
      const res = await contract.stake(amount);
      setBalance(prev => prev - amount);
      setAmount(0);
      addNotification({
        status: 'success',
        directLink: res?.transactionHash
      })
    }
    catch (err) {
      console.log(err);
      addNotification({
        message: "",
        status: 'error',
        directLink: ""
      })
    }
    setProcessLoading(false);
  }

  const unStakePool = async () => {
    setProcessLoading(true);

    try {
      const res = await contract.unstake(amount);

      setAmount(0);
      addNotification({
        status: 'success',
        directLink: res?.transactionHash
      })
    }
    catch (err) {
      console.log(err);
      addNotification({
        message: "",
        status: 'error',
        directLink: ""
      })
    }
    setProcessLoading(false);
  }

  return (
    <Modal processLoading={processLoading} key="stability-pool" layoutId="stability-pool" title="Stability Pool" showModal={open} onClose={() => { onClose?.(); }}>
      <div className="-ml-4">
        <Info message={"Enter the amount of AUSD you'd like to deposit."} status={"normal"} />
        <div className="flex flex-row w-2/3 ml-10 gap-6 mt-6 mb-10">
          <OutlinedButton containerClassName='w-[281px]' className='h-16' innerClassName={`${selectedTab === TABS.DEPOSIT ? "bg-opacity-0" : "bg-opacity-100"}`} onClick={() => { setSelectedTab(TABS.DEPOSIT); setAmount(0); }}>
            Deposit
          </OutlinedButton>
          <OutlinedButton containerClassName='w-[281px]' className='h-16' innerClassName={`${selectedTab === TABS.WITHDRAW ? "bg-opacity-0" : "bg-opacity-100"}`} onClick={() => { setSelectedTab(TABS.WITHDRAW); setAmount(0); }}>
            Withdraw
          </OutlinedButton>
        </div>
        {selectedTab === TABS.DEPOSIT && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
          >
            <InputLayout label="Deposit" hintTitle="AUSD" value={amount} onValueChange={(e) => { setAmount(Number(e.value)); }} hasPercentButton={{ max: true, min: false }} rightBottomSide={
              <div className='flex justify-end mt-2 mr-5'>
                <img alt="aero" className="w-6 h-6" src="/images/ausd.svg" />
                <NumericFormat
                  value={balance}
                  thousandsGroupStyle="thousand"
                  thousandSeparator=","
                  fixedDecimalScale
                  decimalScale={4}
                  displayType="text"
                  renderText={(value) =>
                    <Text size='base' className='flex ml-2 gap-2'>
                      Balance: {value} AUSD
                    </Text>
                  }
                />
              </div>
            } />
            <InputLayout label="Pool Share" hintTitle="%" value={0} className="mt-4 mb-6" />
            <div className='bg-dark-purple rounded-lg px-2 py-4 flex items-center'>
              <Text textColor="text-white" weight="font-normal">Reward</Text>
              <div className='bg-english-violet rounded-lg flex px-2 py-2 mx-10 flex-1'>
                <img alt="aero" className="w-6 h-6" src="/images/sei.png" />
                <NumericFormat
                  value={210.00}
                  thousandsGroupStyle="thousand"
                  thousandSeparator=","
                  fixedDecimalScale
                  decimalScale={2}
                  displayType="text"
                  renderText={(value) =>
                    <Text size='base' className='flex ml-2 gap-2'>
                      {value} SEI
                    </Text>
                  }
                />
              </div>
              <GradientButton className="min-w-[140px] h-0 ml-auto" rounded="rounded-lg">
                <Text>Claim</Text>
              </GradientButton>
            </div>
            <GradientButton loading={processLoading} onClick={() => { stakePool(); }} className="min-w-[221px] h-11 mt-6 ml-auto" rounded="rounded-lg">
              <Text>Confirm</Text>
            </GradientButton>
          </motion.div>
        )}
        {selectedTab === TABS.WITHDRAW && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
          >
            <InputLayout label="Withdraw" hintTitle="AUSD" value={0} hasPercentButton={{ max: true, min: false }} rightBottomSide={
              <div className='flex justify-end mt-2 mr-5'>
                <img alt="aero" className="w-6 h-6" src="/images/sei.png" />
                <NumericFormat
                  value={99.00}
                  thousandsGroupStyle="thousand"
                  thousandSeparator=","
                  fixedDecimalScale
                  decimalScale={2}
                  displayType="text"
                  renderText={(value) =>
                    <Text size='base' className='flex ml-2 gap-2'>
                      Balance: {value} SEI
                    </Text>
                  }
                />
              </div>
            } />
            <InputLayout label="Pool Share" hintTitle="%" value={0} className="mt-4 mb-6" />
            <GradientButton loading={processLoading} onClick={() => { unStakePool(); }} className="min-w-[221px] h-11 mt-6 ml-auto" rounded="rounded-lg">
              <Text>Confirm</Text>
            </GradientButton>
          </motion.div>
        )}
      </div>
    </Modal >
  )
}

export default StabilityPoolModal