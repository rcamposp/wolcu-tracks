class RemoveReference < ActiveRecord::Migration
  def change
  	remove_reference(:markers, :map, index: true, foreign_key: true)
  end
end
